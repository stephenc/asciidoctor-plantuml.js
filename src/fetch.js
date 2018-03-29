const request = require('sync-request')
const fs = require('fs')
const randomstring = require('randomstring')
const path = require('path')
const mkdirp = require('mkdirp')

module.exports.save = function (diagramUrl, doc, target) {
  const dirPath = path.join(doc.getAttribute('imagesoutdir') || '', doc.getAttribute('imagesdir') || '')
  mkdirp.sync(dirPath)
  const diagramName = `${target || randomstring.generate()}.png`
  fs.writeFileSync(path.format({dir: dirPath, base: diagramName}), request('GET', diagramUrl).getBody())
  return diagramName
}
