const request = require('sync-request')
const fs = require('fs')
const randomstring = require('randomstring')
const path = require('path')
const mkdirp = require('mkdirp')

module.exports.name = function (diagramText, target, format) {
  return ((target || require('crypto').createHash('sha256').update(diagramText).digest('hex'))) + '.' + format
}

module.exports.save = function (diagramUrl, doc, diagramName) {
  const dirPath = path.join(doc.getAttribute('imagesoutdir') || '', doc.getAttribute('imagesdir') || '')
  mkdirp.sync(dirPath)
  fs.writeFileSync(path.format({dir: dirPath, base: diagramName}), request('GET', diagramUrl).getBody())
  return diagramName
}

module.exports.get = function (diagramUrl) {
  return request('GET', diagramUrl).getBody()
}
