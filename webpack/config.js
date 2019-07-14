const path = require('path');

module.exports = {
  entry: {
    background: './src/js/background',
    popup: './src/js/content',
    popup: './src/js/popup',
    content: './src/js/standup'
  },
  output: {
    filename: './js/[name].js'
  },
  resolve: {
    modules: [path.join(__dirname, 'src'), 'node_modules']
  },
  module: {
    rules: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      include: path.resolve(__dirname, '../src/js')
    }]
  }
};
