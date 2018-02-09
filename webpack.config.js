const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const capitalize = require("capitalize");
const { version, name } = require("./package.json");

const dirApp = path.join(__dirname, "app");
const dirDist = path.join(__dirname, "dist");

const appHtmlTitle = capitalize.words(name.replace(/-/g, " "));
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
      version,
      repositoryAddress
    }),
    new ExtractTextPlugin("styles.css"),
    new CopyWebpackPlugin([{ from: "assets", to: "assets" }])
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
        test: /\.(jpe?g|png|gif|svg)$/,
        loader: "file-loader",
        options: {
          name: "[path][name].[ext]"
        }
      }
    ]
  }
};
