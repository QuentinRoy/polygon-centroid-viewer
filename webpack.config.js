const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const dirApp = path.join(__dirname, "app");
const dirDist = path.join(__dirname, "dist");

const appHtmlTitle = "Polygon Centroid Viewer";
const repositoryAddress =
  "https://github.com/QuentinRoy/polygon-centroid-viewer";

/**
 * Webpack Configuration
 */
module.exports = {
  entry: {
    bundle: path.join(dirApp, "index")
  },

  output: {
    path: dirDist,
    filename: "[name].js"
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "index.ejs"),
      title: appHtmlTitle,
      repositoryAddress
    }),
    new ExtractTextPlugin("styles.css")
  ],

  module: {
    rules: [
      // BABEL
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /(node_modules)/
      },

      // CSS / SASS
      {
        test: /\.s?css/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: ["css-loader", "postcss-loader", "sass-loader"]
        })
      },

      // EJS
      {
        test: /\.ejs$/,
        loader: "ejs-loader"
      },

      // IMAGES
      {
        test: /\.(jpe?g|png|gif)$/,
        loader: "file-loader",
        options: {
          name: "[path][name].[ext]"
        }
      }
    ]
  }
};
