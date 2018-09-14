const path = require('path')
const Loaders = require('./loaders')

const rootPath = path.join(__dirname, '../')
const NODE_ENV = process.env.NODE_ENV || 'development'

const webpackConfig = {
  mode: NODE_ENV,

  entry: `${rootPath}/src/index.js`,

  output: {
    filename: 'sortableTree.js',
    path: `${rootPath}/build/`,
    publicPath: './'
  },

  resolve: {
    extensions: ['.js', '.jsx', '.css']
  },

  module: {
    rules: [
      {
        test: /js$/,
        use: Loaders.BABEL,
        exclude: /node_modules/
      },
      {
        test: /css$/,
        use: Loaders.CSS,
        exclude: /node_modules/
      }
    ]
  }
}

module.exports = webpackConfig
