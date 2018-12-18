const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

module.exports = {
  add: (image) => {
    mkdirp.sync(image.relative)
    fs.writeFileSync(path.format({dir: image.relative, base: image.basename}), image.contents)
  }
}
