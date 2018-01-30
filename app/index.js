/* eslint-disable func-names */
import {
  select,
  mouse,
  line,
  curveLinearClosed,
  polygonCentroid,
  polygonHull,
  event,
  drag
} from "d3";
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

const polygonHullCentroidPath = measures
  .append("path")
  .classed("hull-centroid", true)
  .classed("hidden", true)
  .attr("d", "M0,0,L10,10M0,10L10,0");

const polygonCentroidPath = measures
  .append("path")
  .classed("centroid", true)
  .classed("hidden", true)
  .attr("d", "M0,0,L10,10M0,10L10,0");

// prettier-ignore
const pathFunction = line()
  .x(d => d.coords[0])
  .y(d => d.coords[1])
  .curve(curveLinearClosed);

// Find the closest point from p on the segment defined by sp1 and sp2.
const closestPointOnSegment = (sp1, sp2, p) => {
  const x10 = sp2[0] - sp1[0];
  const y10 = sp2[1] - sp1[1];
  const x20 = p[0] - sp1[0];
  const y20 = p[1] - sp1[1];
  const t = (x20 * x10 + y20 * y10) / (x10 * x10 + y10 * y10);
  if (t <= 0) return sp1;
  if (t >= 1) return sp2;
  return [sp1[0] + t * x10, sp1[1] + t * y10];
};
// Calculate the distance from a point to another.
const dist = ([x1, y1], [x2, y2]) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
// Calculate the distance from a point to a segment.
const segmentDist = (sp1, sp2, p) => {
  const closest = closestPointOnSegment(sp1, sp2, p);
  return dist(closest, p);
};
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
        return res;
      },
      {
        minDist: segmentDist(points[0].coords, points[n - 1].coords, coords),
        i: n - 1
      }
    ).i + 1
  );
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
  // .origin(d => ({ x: d.x, y: d.y }))
  .on("start", function() {
    removeFeedForward.attr("d", "");
    select(this).classed("dragged", true);
  })
  .on("drag", function(d) {
    removeFeedForward.attr("d", "");
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
  if (data.length < 3) {
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

let nextId = 0;
const createPoint = (...coords) => {
  const p = { id: nextId, coords };
  nextId += 1;
  return p;
};

// eslint-disable-next-line func-names
canvas.on("click", function() {
  // Clear the feedForward.
  addFeedForward.attr("d", "");
  removeFeedForward.attr("d", "");
  const coords = mouse(this);
  const i = findBestInsertionIndex(coords, polygonPoints);
  polygonPoints.splice(i, 0, createPoint(...coords));
  update(polygonPoints);
});

// eslint-disable-next-line func-names
canvas.on("mousemove", function() {
  updateAddFeedForward(mouse(this));
});

update(polygonPoints);
