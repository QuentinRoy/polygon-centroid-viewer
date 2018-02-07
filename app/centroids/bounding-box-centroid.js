export default points => {
  if (points.length < 3) return null;
  const { minX, maxX, minY, maxY } = points.reduce(
    (res, [px, py]) => ({
      minX: Math.min(res.minX, px),
      maxX: Math.max(res.maxX, px),
      minY: Math.min(res.minY, py),
      maxY: Math.max(res.maxY, py)
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY
    }
  );
  return [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2];
};
