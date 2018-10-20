const path = require('path')
const Loaders = require('./loaders')

const rootPath = path.join(__dirname, '../')
const NODE_ENV = process.env.NODE_ENV || 'development'

const webpackConfig = {
  mode: NODE_ENV,

  entry: {
    example_1: `${rootPath}/src/example_1/index.js`,
    example_3: `${rootPath}/src/example_3/index.js`,
    example_4: `${rootPath}/src/example_4/index.js`,
    example_5: `${rootPath}/src/example_5/index.js`
  },

  output: {
    filename: '[name]/[name].js',
    path: `${rootPath}/build/`,
    publicPath: './'
  },

  resolve: {
    extensions: ['.js', '.jsx', '.css', '.sass']
  },

  module: {
    rules: [
      {
        test: /jsx?$/,
        use: Loaders.BABEL,
        exclude: /node_modules/
      },
      {
        test: /css$/,
        use: Loaders.CSS,
        exclude: /node_modules/
      },
      {
        test: /sass$/,
        use: Loaders.SASS,
        exclude: /node_modules/
      }
    ]
  }
}

module.exports = webpackConfig
