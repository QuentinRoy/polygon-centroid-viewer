const webpackMerge = require("webpack-merge");
const webpackConfig = require("./webpack.config");

module.exports = webpackMerge(webpackConfig, {
  devtool: "eval-source-map",
  output: {
    pathinfo: true
  }
});
