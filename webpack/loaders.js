const babelLoader = [
  { loader: 'babel-loader' }
]

const styleLoader = [
  { loader: 'style-loader' }
]

const cssLoader = [
  ...styleLoader,
  { loader: 'css-loader' }
]

const sassLoader = [
  ...styleLoader,
  {
    loader: 'css-loader',
    options: {
      modules: true,
      importLoaders: 2
    }
  },
  { loader: 'sass-loader' }
]

module.exports.CSS = cssLoader
module.exports.SASS = sassLoader
module.exports.BABEL = babelLoader
