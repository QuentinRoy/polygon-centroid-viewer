import { getterSetter } from "../utils";

export default () => {
  let size = 10;
  let offset = 0;

  // prettier-ignore
  const mark = selection => {
    selection.append("path")
      .attr("d", `M${-offset},${-offset},l${size},${size}`);
    selection.append("path")
      .attr("d", `M${-offset},${size - offset}l${size},${-size}`);
  };

  mark.size = getterSetter({
    get: () => size,
    set: newSize => {
      size = newSize;
    }
  });

  mark.offset = getterSetter({
    get: () => offset,
    set: newOffset => {
      offset = newOffset;
    }
  });
  return mark;
};
