const request = require('sync-request')
const fs = require('fs')
const randomstring = require('randomstring')
const path = require('path')
const mkdirp = require('mkdirp')

module.exports.save = function (diagramUrl, target, outputDirectory) {
  mkdirp.sync(outputDirectory || '')
  const diagramName = `${target || randomstring.generate()}.png`
  const diagramPath = path.format({dir: outputDirectory || '', base: diagramName})
  fs.writeFileSync(diagramPath, request('GET', diagramUrl).getBody())
  return diagramName
}
