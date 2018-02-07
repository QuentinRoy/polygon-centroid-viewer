import { polygonCentroid } from "d3-polygon";

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

export default points => {
  if (points.length < 3 || isPolygonSelfIntersecting(points)) {
    return null;
  }
  return polygonCentroid(points);
};
