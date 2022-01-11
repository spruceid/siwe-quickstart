const HtmlWebpackPlugin = require('html-webpack-plugin')

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
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Siwe Quickstart',
      template: 'assets/index.html'
    })
  ]
}
