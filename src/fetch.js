const request = require('sync-request')
const rusha = require('rusha')
const path = require('path')

module.exports.save = function (diagramUrl, doc, target, format, vfs) {
  if (typeof vfs === 'undefined' || typeof vfs.add !== 'function') {
    vfs = require('./node-fs')
  }
  const dirPath = path.join(doc.getAttribute('imagesoutdir') || '', doc.getAttribute('imagesdir') || '')
  const diagramName = `${target || rusha.createHash().update(diagramUrl).digest('hex')}.${format}`
  vfs.add({
    relative: dirPath,
    basename: diagramName,
    mediaType: format === 'svg' ? 'image/svg+xml' : 'image/png',
    contents: request('GET', diagramUrl).getBody()
  })
  return diagramName
}
