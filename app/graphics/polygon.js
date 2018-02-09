import { select } from "d3-selection";
import { line, curveLinearClosed, curveLinear } from "d3-shape";
import { drag } from "d3-drag";
// import { drag } from "d3-drag";
import mark from "./mark";
import { noOp } from "../utils";
import "./polygon.scss";

export default ({ mark: markFactory = mark().align("center") } = {}) => {
  // prettier-ignore
  const edgesLine = line()
    .x(d => d.coords[0])
    .y(d => d.coords[1])
    .curve(curveLinearClosed);

  const feedForwardsLine = line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(curveLinear);

  const vertexDrag = drag();

  // Handle events. Can be set using chart.on.
  const handlers = {
    vertexClick: noOp,
    vertexMouseleave: noOp,
    vertexMouseEnter: noOp,
    click: noOp,
    mouseenter: noOp,
    mouseleave: noOp,
    mousemove: noOp,
    vertexDragStart: noOp,
    vertexDrag: noOp,
    vertexDragEnd: noOp
  };

  // prettier-ignore
  const my = (selection, { partial } = {}) => {
    selection.each(function(data) {
      const canvas = select(this);

      // Initialization
      const chartUpdate = canvas.selectAll(".polygon-chart").data([data]);
      const chartEnter = chartUpdate.enter().append("svg")
        .classed("polygon-chart", true);
      chartEnter.append("path").classed("polygon-area", true);
      chartEnter.append("g").classed("feed-forwards", true);
      chartEnter.append("g").classed("polygon-vertexes", true);
      chartEnter.append("g").classed("centroids", true);
      const chart = chartUpdate.merge(chartEnter);

      if (!partial || partial === "polygon") {
        vertexDrag
          .container(canvas.node())
          .on("start", handlers.vertexDragStart)
          .on("drag", handlers.vertexDrag)
          .on("end", handlers.vertexDragEnd)

        // Set up the polygon area.
        chart.selectAll(".polygon-area")
          .attr("d", d => edgesLine(d.vertexes));
        // Set up the polygon vertexes.
        const vertexes = chart
          .selectAll(".polygon-vertexes")
          .selectAll(".vertex")
            .data(d => d.vertexes, d => d.id);
        vertexes.enter().append("circle")
            .classed("vertex", true)
          .merge(vertexes)
            .attr("cx", d => d.coords[0])
            .attr("cy", d => d.coords[1])
            .classed("dragged", d => d.dragged)
            .on("click", handlers.vertexClick)
            .on("mouseenter", handlers.vertexMouseenter)
            .on("mouseleave", handlers.vertexMouseleave)
            .call(vertexDrag);
        vertexes.exit().remove();
      }

      if (!partial || partial === "centroids") {
        const centroids = canvas
          .selectAll(".centroids")
          .selectAll(".centroid")
            .data(
              d => d.centroids.filter(c => !!c.coords),
              d => d.id || d.type
            );
        centroids.enter().append("g")
            .call(markFactory)
            .attr("class", d => `centroid ${d.type}`)
          .merge(centroids)
            .attr("transform", d => `translate(${d.coords})`);
        centroids.exit().remove();
      }

      if (!partial || partial === "feedForwards") {
        const feedForwards = canvas
          .selectAll(".feed-forwards")
          .selectAll(".feed-forward")
            .data(d => d.feedForwards, d => d.id);
        feedForwards.enter().append("path")
          .merge(feedForwards)
            .attr("d", d => feedForwardsLine(d.path))
            .attr("class", d => `feed-forward ${d.type}`);
        feedForwards.exit().remove();
      }

      if (!partial || partial === "canvasHandlers") {
        // Set up canvas clicks (this can be called multiple times without
        // settings more than one handler).
        canvas
          .on("click", handlers.click)
          .on("mouseenter", handlers.mouseenter)
          .on("mousemove", handlers.mousemove)
          .on("mouseleave", handlers.mouseleave);
      }
    });
  };

  my.on = (eventNames, handler) => {
    eventNames.split(" ").forEach(eventName => {
      handlers[eventName] = handler;
    });
    return my;
  };

  return my;
};
