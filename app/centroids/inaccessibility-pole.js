import polylabel from "@mapbox/polylabel";

export default points => (points.length > 2 ? polylabel([points], 1.0) : null);
