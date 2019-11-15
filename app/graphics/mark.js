import { select } from "d3-selection";
import { line, curveLinearClosed } from "d3-shape";
import { createGetterAndSetters, d3DataConfigProxy } from "../utils";
import "./mark.scss";

export default () => {
  const config = {
    size: 16,
    align: "start",
    decoration: "none",
    decorationSize: 0.7,
    rotate: 0
  };

  const configProxy = d3DataConfigProxy(config);

  const closedLine = line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(curveLinearClosed);

  // prettier-ignore
  const mark = selection =>
    selection.each(function(data) {
      const {
        align,
        size,
        decoration,
        rotate,
        decorationSize
      } = configProxy(data);
      const halfSize = size / 2;
      const offset = align === "center" ? -halfSize : 0;

      const markSelectUpdate = select(this).selectAll(".mark")
        .data([data]);
      const markSelectEnter = markSelectUpdate.enter().append("g")
        .classed("mark", true);
      markSelectEnter.append("path")
        .classed("mark-cross", true);
      const markSelect = markSelectUpdate.merge(markSelectEnter)
        .attr(
          "transform",
          `translate(${offset}, ${offset}) rotate(${rotate}, ${halfSize}, ${halfSize}) `
        );

      markSelect.selectAll(".mark-cross")
        .attr("d", `M0,${halfSize}l${size},0M${halfSize},0l0,${size}`);

      const decoSelection = markSelect.selectAll(".mark-decoration");
      if (
        (decoSelection.size() === 1 &&
          decoSelection.attr("class") === `mark-${decoration}-decoration`) ||
        (decoSelection.size() === 0 && decoration === "none")
      ) {
        return;
      }
      decoSelection.remove();

      const decorationTransform = () =>
        `matrix(${decorationSize}, 0, 0, ${decorationSize}, ${halfSize -
          decorationSize * halfSize}, ${halfSize - decorationSize * halfSize})`;

      switch(decoration){
        case "losange":
          markSelect.append("path")
            .attr("class", "mark-losange-decoration mark-decoration")
            .attr(
              "d",
              closedLine([
                [0, size / 2],
                [size / 2, size],
                [size, size / 2],
                [size / 2, 0]
              ])
            )
            .attr('transform', decorationTransform);
          break;
        case "circle":
          markSelect.append("circle")
            .attr("class", "mark-circle-decoration mark-decoration")
            .attr("r", halfSize / Math.sqrt(2))
            .attr("cx", halfSize)
            .attr("cy", halfSize)
            .attr('transform', decorationTransform);
          break;
        default:
          throw new Error(`Unknown decoration type: ${decoration}`);
      }
    });

  return createGetterAndSetters({
    source: config,
    target: mark
  });
};
