const path = require('path');

module.exports = {
  entry: {
    background: './src/js/background',
    api: './src/js/api',
    content: './src/js/content',
    popup: './src/js/popup',
    standup: './src/js/standup'
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
