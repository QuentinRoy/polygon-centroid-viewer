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

export const sameSign = (a, b) => a * b > 0;

export const segmentIntersect = ([x1, y1], [x2, y2], [x3, y3], [x4, y4]) => {
  // Compute a1, b1, c1, where line joining points 1 and 2
  // is "a1 x + b1 y + c1 = 0".
  const a1 = y2 - y1;
  const b1 = x1 - x2;
  const c1 = x2 * y1 - x1 * y2;

  // Compute r3 and r4.
  const r3 = a1 * x3 + b1 * y3 + c1;
  const r4 = a1 * x4 + b1 * y4 + c1;

  // Check signs of r3 and r4. If both point 3 and point 4 lie on
  // same side of line 1, the line segments do not intersect.
  if (r3 !== 0 && r4 !== 0 && sameSign(r3, r4)) {
    return false; // return that they do not intersect
  }

  // Compute a2, b2, c2
  const a2 = y4 - y3;
  const b2 = x3 - x4;
  const c2 = x4 * y3 - x3 * y4;

  // Compute r1 and r2
  const r1 = a2 * x1 + b2 * y1 + c2;
  const r2 = a2 * x2 + b2 * y2 + c2;

  // Check signs of r1 and r2. If both point 1 and point 2 lie
  // on same side of second line segment, the line segments do
  // not intersect.
  if (r1 !== 0 && r2 !== 0 && sameSign(r1, r2)) {
    return false; // return that they do not intersect
  }

  // Line segments intersect: compute intersection point.
  const denom = a1 * b2 - a2 * b1;

  if (denom === 0) {
    return true; // collinear
  }

  // lines_intersect
  return true; // lines intersect, return true
};

// Check if a polygon is self-intersecting (do not deal with co-linear
// adjacent segments).
export const isPolygonSelfIntersecting = vertexes => {
  const n = vertexes.length;
  // For each polygon edge, check if it intersects with another.
  return vertexes.find((seg1Start, i) => {
    const seg1End = vertexes[(i + 1) % n];
    // Do not check for intersection with adjacent edges. Because there is a
    // vertex in common, adjacent edges necessarily intersects. However they
    // only make a polygon self-intersect if co-linear which does not seem
    // to impact the centroid calculation. Hence it is fine for this project.
    const maxJ = i === 0 ? n - 1 : n;
    for (let j = i + 2; j < maxJ; j += 1) {
      const seg2Start = vertexes[j];
      const seg2End = vertexes[(j + 1) % n];
      if (segmentIntersect(seg1Start, seg1End, seg2Start, seg2End)) {
        return true;
      }
    }
    return false;
  });
};
