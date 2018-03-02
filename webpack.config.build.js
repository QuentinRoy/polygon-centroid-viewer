const webpack = require("webpack");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const webpackMerge = require("webpack-merge");
const webpackConfig = require("./webpack.config");

module.exports = webpackMerge(webpackConfig, {
  devtool: "source-map",
  mode: "production",
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production")
    }),
    new CleanWebpackPlugin(["dist"]),
    new UglifyJSPlugin({ sourceMap: true }),
    new webpack.optimize.ModuleConcatenationPlugin()
  ]
});
