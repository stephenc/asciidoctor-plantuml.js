const webpack = require('webpack')
const path = require('path')

const config = {
  entry: './src/asciidoctor-plantuml.js',
  output: {
    path: path.resolve(__dirname, 'dist/browser'),
    filename: 'asciidoctor-plantuml.js',
    library: 'AsciidoctorPlantuml'
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/fetch$/)
  ],
  mode: 'production'
}

module.exports = config
