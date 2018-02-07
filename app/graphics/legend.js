import { select } from "d3-selection";
import mark from "./mark";
import { getterSetter } from "../utils";

const DEFAULT_CROSS_SIZE = 10;
const DEFAULT_LABEL_OFFSET = 20;

const legendItem = () => {
  let label = "";
  let markFactory = mark().size(DEFAULT_CROSS_SIZE);
  let labelOffset = DEFAULT_LABEL_OFFSET;

  // prettier-ignore
  const my = selection => {
    const markSize = markFactory.size();
    const item = selection.append("div")
      .attr("class", d => d.id)
      .classed("legend-item", true)

    item.append("svg")
      // .attr("viewBox", `0 0 ${markSize} ${markSize}`)
      .attr("width", markSize)
      .attr("height", markSize)
      .call(markFactory)
      .classed("legend-icon");

    item.append("span")
      .classed("legend-text", true)
      .text(label);
  };

  my.label = getterSetter({
    get: () => label,
    set: newLabel => {
      label = newLabel;
    }
  });

  my.markSize = getterSetter({
    get: () => markFactory.size(),
    set: newSize => {
      markFactory = markFactory.size(newSize);
    }
  });

  my.labelOffset = getterSetter({
    get: () => labelOffset,
    set: newLabelOffset => {
      labelOffset = newLabelOffset;
    }
  });
  return my;
};

export default () => {
  const legendItemFactor = legendItem().label(d => d.name);

  const chart = selection =>
    selection.each(function(data) {
      const legendG = select(this);

      // prettier-ignore
      const legendItems = legendG.selectAll(".legend-item")
        .data(data, d => d.id);

      legendItems.enter().call(legendItemFactor);
      legendItems.exit().remove();
    });
  return chart;
};
