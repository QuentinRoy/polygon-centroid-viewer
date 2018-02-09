import { select, mouse, event } from "d3-selection";
import mark from "./graphics/mark";
import legend from "./graphics/legend";
import polygon from "./graphics/polygon";
import { createIdGenerator, angle, segmentDist } from "./utils";
import hullCentroid from "./centroids/hull-centroid";
import polygonCentroid from "./centroids/polygon-centroid";
import boundingBoxCentroid from "./centroids/bounding-box-centroid";
import inaccessibilityPole from "./centroids/inaccessibility-pole";

const createVertexFactory = () => {
  const getNewVertexId = createIdGenerator();
  return coords => ({
    id: getNewVertexId(),
    coords,
    hovered: false,
    dragged: false
  });
};

export default ({
  initVertexes = [],
  canvasNode = ".canvas",
  legendNode = ".legend",
  onChanged = () => {}
} = {}) => {
  const ADD_OR_REMOVE_FEED_FORWARD_ID = "addOrRemoveFeedForward";

  const createNewVertex = createVertexFactory();

  // Data.
  const data = {
    hoveredVertex: null,
    feedForwards: [],
    vertexes: initVertexes.map(createNewVertex),
    centroids: []
  };

  const canvasSelection = select(canvasNode);
  const legendSelection = select(legendNode);

  const recalculateCentroids = () => {
    const vertexesCoords = data.vertexes.map(v => v.coords);
    data.centroids = [
      {
        coords: polygonCentroid(vertexesCoords),
        name: "Polygon Centroid",
        type: "polygon-centroid"
      },
      {
        coords: hullCentroid(vertexesCoords),
        name: "Convex Hull Centroid",
        type: "hull-centroid"
      },
      {
        coords: boundingBoxCentroid(vertexesCoords),
        name: "Bounding Box Centroid",
        type: "bounding-box-centroid"
      },
      {
        coords: inaccessibilityPole(vertexesCoords),
        name: "Pole of Inacessibilty",
        type: "inacessibilty-pole"
      }
    ];
  };

  const centroidMark = () =>
    mark()
      .size(16)
      .decoration(d => {
        switch (d.type) {
          default:
            return "none";
          case "bounding-box-centroid":
            return "losange";
          case "inacessibilty-pole":
            return "circle";
        }
      })
      .rotate(d => {
        switch (d.type) {
          default:
            return 0;
          case "bounding-box-centroid":
          case "hull-centroid":
            return 45;
        }
      });

  const centroidLegend = legend({ mark: centroidMark().align("start") });
  const polygonChart = polygon({ mark: centroidMark().align("center") });

  const updateCanvas = config => {
    canvasSelection.datum(data).call(polygonChart, config);
  };

  const updateLegend = config => {
    legendSelection.datum(data.centroids).call(centroidLegend, config);
  };

  // Find the best insertion insertion index for a new point defined by coords
  // in the polygon. The best insertion index is after the first point of the
  // closest segment.
  const findBestInsertionIndex = (coords, vertexes) => {
    const n = vertexes.length;
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

  const clearAddOrRemoveFeedForward = () => {
    data.feedForwards = data.feedForwards.filter(
      ff => ff.id !== ADD_OR_REMOVE_FEED_FORWARD_ID
    );
  };

  const setUpAddFeedForward = coords => {
    const { vertexes } = data;
    const n = vertexes.length;
    clearAddOrRemoveFeedForward();
    if (n > 0) {
      const i = findBestInsertionIndex(coords, vertexes);
      // Adds n to i when calculating the prev vertex to make sure we do not have a
      // negative index in case i = 0 (because % is not really the modulo).
      const prev = vertexes[i - 1];
      const next = vertexes[i % n];
      data.feedForwards = [
        ...data.feedForwards,
        {
          path: [prev.coords, coords, next.coords],
          id: ADD_OR_REMOVE_FEED_FORWARD_ID,
          type: "add-vertex"
        }
      ];
    }
  };

  const setUpRemoveFeedForward = vertex => {
    const { vertexes } = data;
    const n = vertexes.length;
    // Remove any feed-forwards of type add or remove.
    data.feedForwards = data.feedForwards.filter(
      ff => ff.id !== ADD_OR_REMOVE_FEED_FORWARD_ID
    );
    // Only add a remove feed forward if there is enough vertexes to display it.
    if (n > 3) {
      const vi = vertexes.indexOf(vertex);
      const first = vertexes[(vi - 1 + n) % n];
      const second = vertexes[(vi + 1) % n];
      data.feedForwards = [
        ...data.feedForwards,
        {
          type: "remove-vertex",
          path: [first.coords, second.coords],
          id: ADD_OR_REMOVE_FEED_FORWARD_ID
        }
      ];
    }
  };

  polygonChart
    .on("mouseenter mousemove", () => {
      // Add feedForward is only present if no vertex is hovered.
      if (data.hoveredVertex) return;
      setUpAddFeedForward(mouse(canvasSelection.node()));
      updateCanvas({ partial: "feedForwards" });
    })
    .on("mouseleave", () => {
      clearAddOrRemoveFeedForward();
      updateCanvas({ partial: "feedForwards" });
    });

  polygonChart
    .on("vertexMouseenter", vertex => {
      data.hoveredVertex = vertex;
      vertex.hovered = true; // eslint-disable-line no-param-reassign
      setUpRemoveFeedForward(vertex);
      updateCanvas({ partial: "feedForwards" });
    })
    .on("vertexMouseleave", () => {
      data.hoveredVertex.hovered = false;
      data.hoveredVertex = null;
      setUpAddFeedForward(mouse(canvasSelection.node()));
      updateCanvas({ partial: "feedForwards" });
    });

  polygonChart.on("click", () => {
    const coords = mouse(canvasSelection.node());
    const i = findBestInsertionIndex(coords, data.vertexes);
    const newVertex = createNewVertex(coords);
    data.vertexes.splice(i, 0, newVertex);
    setUpRemoveFeedForward(newVertex);
    recalculateCentroids();
    updateCanvas();
    onChanged("add");
  });

  polygonChart.on("vertexClick", clickedVertex => {
    data.vertexes = data.vertexes.filter(v => v !== clickedVertex);
    if (data.hoveredVertex === clickedVertex) data.hoveredVertex = null;
    setUpAddFeedForward(mouse(canvasSelection.node()));
    recalculateCentroids();
    updateCanvas();
    // Stop the propagation to avoid a canvas click event (that would add a new
    // vertex).
    event.stopPropagation();
    onChanged("remove");
  });

  polygonChart.on("vertexDragStart vertexDrag", vertex => {
    clearAddOrRemoveFeedForward();
    vertex.dragged = true; // eslint-disable-line no-param-reassign
    vertex.coords = [event.x, event.y]; // eslint-disable-line no-param-reassign
    recalculateCentroids();
    updateCanvas();
    onChanged("drag");
  });

  polygonChart.on("vertexDragEnd", vertex => {
    vertex.dragged = false; // eslint-disable-line no-param-reassign
    vertex.coords = [event.x, event.y]; // eslint-disable-line no-param-reassign
    setUpRemoveFeedForward(vertex);
    recalculateCentroids();
    updateCanvas();
    onChanged("dragEnd");
  });

  recalculateCentroids();
  updateCanvas();
  updateLegend();

  return {
    getVertexes: () => data.vertexes.map(v => [...v.coords]),
    setVertexes(vertexes) {
      data.vertexes = vertexes.map(createNewVertex);
      recalculateCentroids();
      updateCanvas();
      onChanged("set");
    }
  };
};
