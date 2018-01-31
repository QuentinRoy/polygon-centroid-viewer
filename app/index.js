/* eslint-disable func-names */
import { select, mouse, event } from "d3-selection";
import { line, curveLinearClosed } from "d3-shape";
import { polygonCentroid, polygonHull } from "d3-polygon";
import { drag } from "d3-drag";
import {
  segmentDist,
  angle,
  createIdGenerator,
  isPolygonSelfIntersecting
} from "./utils";
import "./index.scss";

let polygonVertexes = [];

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
const polygonVertexesGroup = polygon.append("g")
  .classed("vertexes", true);
// prettier-ignore
const measures = canvas.append("g")
  .classed("measures", true);
// prettier-ignore
const polygonHullCentroidPath = measures.append("path")
  .classed("hull-centroid", true)
  .classed("hidden", true)
  .attr("d", "M-5,-5,L5,5M-5,5L5,-5");
// prettier-ignore
const polygonCentroidPath = measures.append("path")
  .classed("centroid", true)
  .classed("hidden", true)
  .attr("d", "M-5,-5,L5,5M-5,5L5,-5");

// prettier-ignore
const pathFunction = line()
  .x(d => d.coords[0])
  .y(d => d.coords[1])
  .curve(curveLinearClosed);

// Find the best insertion insertion index for a new point defined by coords
// in the polygon. The best insertion index is after the first point of the
// closest segment.
const findBestInsertionIndex = (coords, vertexes) => {
  const n = polygonVertexes.length;
  if (n < 3) return n;
  // Check the distance from each segment and find the closest.
  return (
    vertexes.reduce(
      (res, p1, i) => {
        if (i + 1 >= n) return res;
        const p2 = vertexes[i + 1];
        const d = segmentDist(p1.coords, p2.coords, coords);
        if (d < res.minD)
          return {
            i,
            minD: d
          };
        // In case of equality (happens often if the closest point is a vertex
        // look for the position that would create the largest angle).
        if (d === res.minD) {
          const resP1 = vertexes[res.i];
          const resP2 = vertexes[(res.i + 1) % vertexes.length];
          const resAngle = angle(resP1.coords, coords, resP2.coords);
          const currentAngle = angle(p1.coords, coords, p2.coords);
          if (currentAngle > resAngle)
            return {
              i,
              minD: d
            };
        }
        return res;
      },
      {
        minD: segmentDist(vertexes[0].coords, vertexes[n - 1].coords, coords),
        i: n - 1
      }
    ).i + 1
  );
};

const updateAddFeedForward = coordinates => {
  if (polygonVertexes.length === 0) {
    addFeedForward.attr("d", "");
  } else if (polygonVertexes.length === 1) {
    addFeedForward.attr("d", `M${polygonVertexes[0].coords}L${coordinates}`);
  } else {
    const i = findBestInsertionIndex(coordinates, polygonVertexes) - 1;
    const sp1 = polygonVertexes[i];
    const sp2 = polygonVertexes[(i + 1) % polygonVertexes.length];
    addFeedForward.attr("d", `M${sp1.coords}L${coordinates}L${sp2.coords}`);
  }
};

const updateRemoveFeedForward = currentVertexIndex => {
  if (polygonVertexes.length < 4) {
    removeFeedForward.attr("d", "");
  } else {
    const n = polygonVertexes.length;
    const prev = polygonVertexes[(currentVertexIndex - 1 + n) % n];
    const next = polygonVertexes[(currentVertexIndex + 1) % n];
    removeFeedForward.attr("d", `M${prev.coords}L${next.coords}`);
  }
};

const vertexClicked = d => {
  removeFeedForward.attr("d", "");
  event.stopPropagation();
  polygonVertexes = polygonVertexes.filter(p => p !== d);
  update(polygonVertexes);
  updateAddFeedForward([event.x, event.y]);
};

const vertexDrag = drag()
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
    updatePolygonPath(polygonVertexes);
    updatePolygonCentroid(polygonVertexes);
    updatePolygonHullCentroid(polygonVertexes);
  })
  .on("end", function(d) {
    select(this).classed("dragged", false);
    updateRemoveFeedForward(polygonVertexes.indexOf(d));
  });

updatePolygonCentroid = data => {
  if (
    data.length < 3 ||
    isPolygonSelfIntersecting(polygonVertexes.map(v => v.coords))
  ) {
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

updatePolygonPath = data => {
  polygonPath.attr("d", pathFunction(data));
};

// prettier-ignore
const updatePolygonVertexes = vertexData => {
  const vertexes = polygonVertexesGroup.selectAll(".vertex")
    .data(vertexData, d => d.id);

  vertexes.enter()
    .append("circle")
      .classed("vertex", true)
      .on("click", vertexClicked)
      .on("mouseover", (d) => {
        updateRemoveFeedForward(polygonVertexes.indexOf(d));
      })
      .on("mouseout", () => {
        removeFeedForward.attr("d", "");
      })
      .on("mousemove", () => {
        event.stopPropagation()
        addFeedForward.attr("d", "");
      })
      .call(vertexDrag)
    .merge(vertexes)
      .attr("cx", d => d.coords[0])
      .attr("cy", d => d.coords[1]);

  vertexes.exit().remove();

};

update = vertexData => {
  updatePolygonPath(vertexData);
  updatePolygonVertexes(vertexData);
  updatePolygonHullCentroid(vertexData);
  updatePolygonCentroid(vertexData);
};

const getNewVertexId = createIdGenerator();
const createVertex = coords => ({
  id: getNewVertexId(),
  coords
});

// eslint-disable-next-line func-names
canvas.on("click", function() {
  // Clear the feedForward.
  addFeedForward.attr("d", "");
  removeFeedForward.attr("d", "");
  const coords = mouse(this);
  const i = findBestInsertionIndex(coords, polygonVertexes);
  polygonVertexes.splice(i, 0, createVertex(coords));
  update(polygonVertexes);
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

update(polygonVertexes);
