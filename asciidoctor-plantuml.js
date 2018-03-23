/* global Opal */
const plantumlEncoder = require('plantuml-encoder')

function createImageSrc (serverUrl, shouldFetch, outdir, text) {
  let diagramUrl = `${serverUrl}/png/${plantumlEncoder.encode(text)}`
  if (shouldFetch) {
    const fetch = require('./lib/fetch')
    diagramUrl = fetch.save(diagramUrl, outdir)
  }
  return diagramUrl
}

function plantumlBlock () {
  this.named('plantuml')
  this.onContext('listing')

  this.process((parent, reader, attrs) => {
    const doc = parent.getDocument()
    const diagramText = reader.getLines().join('\n')
    const serverUrl = process.env.PLANTUML_SERVER_URL || doc.getAttribute('plantuml-server-url')
    if (serverUrl) {
      const shouldFetch = doc.isAttribute('plantuml-fetch-diagram')
      const imagesOutDir = doc.getAttribute('imagesoutdir')
      const imageUrl = createImageSrc(serverUrl, shouldFetch, imagesOutDir, diagramText)
      let roles = Opal.hash_get(attrs, 'role')
      return this.createImageBlock(parent, {role: roles ? `${roles} plantuml` : 'plantuml', target: imageUrl, alt: 'diagram'})
    } else {
      console.warn('Skipping plantuml block. PlantUML Server URL not defined in plantuml-server-url attribute or PLANTUML_SERVER_URL environment variable.')
      let roles = Opal.hash_get(attrs, 'role')
      Opal.hash_put(attrs, 'role', roles ? `${roles} plantuml-error` : 'plantuml-error')
      return this.createBlock(parent, 'listing', diagramText, attrs)
    }
  })
}

module.exports.register = function register (registry) {
  if (typeof registry.register === 'function') {
    registry.register(function () {
      this.block(plantumlBlock)
    })
  } else if (typeof registry.block === 'function') {
    registry.block('plantuml', plantumlBlock)
  }
  return registry
}
