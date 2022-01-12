const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  resolve: {
    fallback: {
      fs: false,
      path: false,
      util: false
    }
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },

  module: {

    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,

          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'assets/images',
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },

    ]

  },

  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'assets',
          to: './',
          globOptions: {
            ignore: ['*.DS_Store'],
          },
          noErrorOnMissing: true,
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html'
    }),

    new MiniCssExtractPlugin({
      filename: "style.css",
    })
  ]

};
