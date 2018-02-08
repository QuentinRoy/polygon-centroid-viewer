import { select } from "d3-selection";
import mark from "./mark";
import { createGetterAndSetters } from "../utils";

const legendItem = ({ mark: markFactory = mark() }) => {
  const config = {
    label: ""
  };

  // prettier-ignore
  const my = selection => {
    const markSize = markFactory.size();
    const item = selection.append("div")
      .attr("class", d => d.type)
      .classed("legend-item", true)

    item.append("svg")
      .attr("viewBox", `-1 -1 ${markSize + 2} ${markSize + 2}`)
      .attr("width", markSize + 2)
      .attr("height", markSize + 2)
      .classed("legend-icon", true)
      .style("vertical-align", "bottom")
      .call(markFactory);

    item.append("span")
      .classed("legend-text", true)
      .text(config.label);
  };

  return createGetterAndSetters({
    source: config,
    target: my
  });
};

export default ({ mark: markFactory }) => {
  const legendItemFactory = legendItem({ mark: markFactory }).label(
    d => d.name
  );

  const chart = selection =>
    selection.each(function(data) {
      const legendG = select(this);

      // prettier-ignore
      const legendItems = legendG.selectAll(".legend-item")
        .data(data, d => d.id);

      legendItems.enter().call(legendItemFactory);
      legendItems.exit().remove();
    });
  return chart;
};
