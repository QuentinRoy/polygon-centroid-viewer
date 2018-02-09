// Find the closest point from p on the segment defined by sp1 and sp2.
export const closestPointOnSegment = (sp1, sp2, p) => {
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
export const dist = ([x1, y1], [x2, y2]) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// Calculate the distance from a point to a segment.
export const segmentDist = (sp1, sp2, p) => {
  const closest = closestPointOnSegment(sp1, sp2, p);
  return dist(closest, p);
};

// Calculate the angle p1 o p2.
export const angle = (p1, o, p2) => {
  const op1 = dist(p1, o);
  const op2 = dist(p2, o);
  const p1p2 = dist(p1, p2);
  return Math.acos((op2 * op2 + op1 * op1 - p1p2 * p1p2) / (2 * op2 * op1));
};

// Create a function whose successful calls return a different identifier.
export const createIdGenerator = () => {
  let nextId = 0;
  return () => {
    const id = nextId;
    nextId += 1;
    return id;
  };
};

// Creates a getter/setter function for reusable d3 components.
// Called without arguments, the function acts as a getter, called with at least
// one argument, it acts as a setter.
// When used as a getter, it returns its context or this.
export const getterSetter = ({ get, set, context }) =>
  function getSet(...args) {
    if (args.length === 0) return get();
    set(...args);
    return context || this;
  };

export const createGetterAndSetters = ({
  props,
  get,
  set,
  source = {},
  target = {}
} = {}) => {
  (props || Object.keys(source)).forEach(prop => {
    // eslint-disable-next-line no-param-reassign
    target[prop] = getterSetter({
      get: get ? (...args) => get(prop, ...args) : () => source[prop],
      set: set
        ? (...args) => set(prop, ...args)
        : value => {
            source[prop] = value; // eslint-disable-line no-param-reassign
          }
    });
  });
  return target;
};

export const noOp = () => {};

export const evalD3DataConfig = (val, d) =>
  typeof val === "function" ? val(d) : val;

export const d3DataConfigProxy = target => d =>
  new Proxy(target, {
    get: (t, name) => {
      const prop = t[name];
      if (typeof prop === "function") return prop(d);
      return prop;
    }
  });

// Trigger a text file download.
// Modified from https://stackoverflow.com/a/18197341/2212031.
export const downloadTextFile = (text, filename) => {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
  );
  if (filename != null) element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
