const webpack = require('webpack')
const path = require('path')

const config = {
  entry: './asciidoctor-plantuml.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    library: 'AsciidoctorPlantuml'
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/lib\/fetch$/)
  ],
  mode: 'production'
}

module.exports = config
