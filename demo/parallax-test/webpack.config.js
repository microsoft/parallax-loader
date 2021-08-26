const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
   index: './src/index.jsx',
  },
  resolve: {
      extensions: [".js", ".jsx"]
  },
  mode: "development",
  output: {
    filename: 'js/bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ],
  devServer: {
    open: true,
    port: 8000
  },
  module: {
    rules: [
      {
        test: /\.js(x?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /Config\.ini$/,
        exclude: /node_modules/,
        use: {
          loader: 'parallax-loader',
          options: {
              schema: path.resolve(__dirname, './config/Config.ts')
          }
        }
      }
    ]
  }
}
