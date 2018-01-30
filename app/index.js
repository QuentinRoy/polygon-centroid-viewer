/* eslint-disable func-names */
import { select, mouse, event } from "d3-selection";
import { line, curveLinearClosed } from "d3-shape";
import { polygonCentroid, polygonHull } from "d3-polygon";
import { drag } from "d3-drag";
import {
  segmentDist,
  angle,
  createIdGenerator,
  segmentIntersect
} from "./utils";
import "./index.scss";

let polygonPoints = [];

let update;
let updatePolygonPath;
let updatePolygonCentroid;
let updatePolygonHullCentroid;

const canvas = select(".canvas");

// prettier-ignore
const polygon = canvas.append("g")
  .classed("polygon", true);
// prettier-ignore
const polygonPath = polygon.append("path")
  .classed("area", true);
// prettier-ignore
const addFeedForward = polygon.append("path")
  .classed("add-feed-forward", true);
// prettier-ignore
const removeFeedForward = polygon.append("path")
  .classed("remove-feed-forward", true);
// prettier-ignore
const polygonPointsGroup = polygon.append("g")
  .classed("points", true);
// prettier-ignore
const measures = canvas.append("g")
  .classed("measures", true);
// prettier-ignore
const polygonHullCentroidPath = measures.append("path")
  .classed("hull-centroid", true)
  .classed("hidden", true)
  .attr("d", "M0,0,L10,10M0,10L10,0");
// prettier-ignore
const polygonCentroidPath = measures.append("path")
  .classed("centroid", true)
  .classed("hidden", true)
  .attr("d", "M0,0,L10,10M0,10L10,0");

// prettier-ignore
const pathFunction = line()
  .x(d => d.coords[0])
  .y(d => d.coords[1])
  .curve(curveLinearClosed);

// Find the best insertion insertion index for a new point defined by coords
// in the polygon. The best insertion index is after the first point of the
// closest segment.
const findBestInsertionIndex = (coords, points) => {
  const n = polygonPoints.length;
  if (n < 3) return n;
  return (
    points.reduce(
      (res, p1, i) => {
        if (i + 1 >= n) return res;
        const p2 = points[i + 1];
        const d = segmentDist(p1.coords, p2.coords, coords);
        if (d < res.minDist) return { i, minDist: d };
        if (d === res.minDist) {
          const resP1 = points[res.i];
          const resP2 = points[(res.i + 1) % points.length];
          const resAngle = angle(resP1.coords, coords, resP2.coords);
          const currentAngle = angle(p1.coords, coords, p2.coords);
          if (currentAngle > resAngle) return { i, minDist: d };
        }
        return res;
      },
      {
        minDist: segmentDist(points[0].coords, points[n - 1].coords, coords),
        i: n - 1
      }
    ).i + 1
  );
};

// Check if a polygon is self intersecting.
const isSelfIntersecting = points => {
  const n = points.length;
  return points.find((seg1Start, i) => {
    const seg1End = points[(i + 1) % n];
    const maxJ = i === 0 ? n - 1 : n;
    for (let j = i + 2; j < maxJ; j += 1) {
      const seg2Start = points[j];
      const seg2End = points[(j + 1) % n];
      if (
        segmentIntersect(
          seg1Start.coords,
          seg1End.coords,
          seg2Start.coords,
          seg2End.coords
        )
      ) {
        return true;
      }
    }
    return false;
  });
};

const updateAddFeedForward = coordinates => {
  if (polygonPoints.length === 0) {
    addFeedForward.attr("d", "");
  } else if (polygonPoints.length === 1) {
    addFeedForward.attr("d", `M${polygonPoints[0].coords}L${coordinates}`);
  } else {
    const i = findBestInsertionIndex(coordinates, polygonPoints) - 1;
    const sp1 = polygonPoints[i];
    const sp2 = polygonPoints[(i + 1) % polygonPoints.length];
    addFeedForward.attr("d", `M${sp1.coords}L${coordinates}L${sp2.coords}`);
  }
};

const updateRemoveFeedForward = currentPointI => {
  if (polygonPoints.length < 4) {
    removeFeedForward.attr("d", "");
  } else {
    const n = polygonPoints.length;
    const prev = polygonPoints[(currentPointI - 1 + n) % n];
    const next = polygonPoints[(currentPointI + 1) % n];
    removeFeedForward.attr("d", `M${prev.coords}L${next.coords}`);
  }
};

const pointClicked = d => {
  removeFeedForward.attr("d", "");
  event.stopPropagation();
  polygonPoints = polygonPoints.filter(p => p !== d);
  update(polygonPoints);
  updateAddFeedForward([event.x, event.y]);
};

const pointDrag = drag()
  .on("start", function() {
    removeFeedForward.attr("d", "");
    addFeedForward.attr("d", "");
    select(this).classed("dragged", true);
  })
  .on("drag", function(d) {
    removeFeedForward.attr("d", "");
    addFeedForward.attr("d", "");
    d.coords = [event.x, event.y]; // eslint-disable-line
    select(this)
      .attr("cx", d.coords[0])
      .attr("cy", d.coords[1]);
    updatePolygonPath(polygonPoints);
    updatePolygonCentroid(polygonPoints);
    updatePolygonHullCentroid(polygonPoints);
  })
  .on("end", function(d) {
    select(this).classed("dragged", false);
    updateRemoveFeedForward(polygonPoints.indexOf(d));
  });

updatePolygonCentroid = data => {
  if (data.length < 3 || isSelfIntersecting(polygonPoints)) {
    polygonCentroidPath.classed("hidden", true);
  } else {
    polygonCentroidPath.classed("hidden", false);
    const coordinates = polygonCentroid(data.map(p => p.coords));
    polygonCentroidPath.attr("transform", `translate(${coordinates})`);
  }
};

updatePolygonHullCentroid = data => {
  if (data.length < 3) {
    polygonHullCentroidPath.classed("hidden", true);
  } else {
    polygonHullCentroidPath.classed("hidden", false);
    const coordinates = polygonCentroid(polygonHull(data.map(p => p.coords)));
    polygonHullCentroidPath.attr("transform", `translate(${coordinates})`);
  }
};

// prettier-ignore
updatePolygonPath = data => {
  polygonPath
    .attr("d", pathFunction(data));
};

// prettier-ignore
const updatePolygonPoints = data => {
  const points = polygonPointsGroup.selectAll(".point")
    .data(data, d => d.id);

  points.exit().remove();

  points.enter()
    .append("circle")
      .attr("class", "point")
      .on("click", pointClicked)
      .on("mouseover", (d) => {
        updateRemoveFeedForward(polygonPoints.indexOf(d));
      })
      .on("mouseout", () => {
        removeFeedForward.attr("d", "");
      })
      .on("mousemove", () => {
        event.stopPropagation()
        addFeedForward.attr("d", "");
      })
      .call(pointDrag)
    .merge(points)
      .attr("cx", d => d.coords[0])
      .attr("cy", d => d.coords[1]);
};

update = data => {
  updatePolygonPath(data);
  updatePolygonPoints(data);
  updatePolygonHullCentroid(data);
  updatePolygonCentroid(data);
};

const getNewPointId = createIdGenerator();
const createPoint = coords => ({
  id: getNewPointId(),
  coords
});

// eslint-disable-next-line func-names
canvas.on("click", function() {
  // Clear the feedForward.
  addFeedForward.attr("d", "");
  removeFeedForward.attr("d", "");
  const coords = mouse(this);
  const i = findBestInsertionIndex(coords, polygonPoints);
  polygonPoints.splice(i, 0, createPoint(coords));
  update(polygonPoints);
});

// eslint-disable-next-line func-names
canvas
  .on("mouseover", function() {
    updateAddFeedForward(mouse(this));
  })
  .on("mousemove", function() {
    updateAddFeedForward(mouse(this));
  })
  .on("mouseout", () => {
    addFeedForward.attr("d", "");
    removeFeedForward.attr("d", "");
  });

update(polygonPoints);
