import { polygonCentroid, polygonHull } from "d3-polygon";

export default points =>
  points.length > 2 ? polygonCentroid(polygonHull(points)) : null;
