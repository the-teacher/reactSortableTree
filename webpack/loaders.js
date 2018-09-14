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

module.exports.CSS = cssLoader
module.exports.BABEL = babelLoader
