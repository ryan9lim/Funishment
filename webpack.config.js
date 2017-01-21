var webpack = require('webpack');  
module.exports = {  
  entry: {
    "index": "./js/app.js",
    "room" : "./js/room.js"
  },
  output: {
    path: __dirname + '/static',
    filename: "[name].js"
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        },
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
  ]
};
