/* global Opal */
const plantumlEncoder = require('plantuml-encoder')

function serverUnavailableBlock (processor, parent, context, source, attrs) {
  return processor.createBlock(parent, context, source, attrs)
}

function createImageSrc (doc, text, target, format) {
  const serverUrl = doc.getAttribute('plantuml-server-url')
  const shouldFetch = doc.isAttribute('plantuml-fetch-diagram')
  let diagramUrl = `${serverUrl}/${format}/${plantumlEncoder.encode(text)}`
  if (shouldFetch) {
    diagramUrl = require('./fetch').save(diagramUrl, doc, target, format)
  }
  return diagramUrl
}

function plantumlBlock () {
  this.named('plantuml')
  this.onContext(['listing', 'literal'])
  this.positionalAttributes(['target', 'format'])

  this.process((parent, reader, attrs) => {
    const doc = parent.getDocument()
    const diagramText = reader.getString()
    const serverUrl = doc.getAttribute('plantuml-server-url')
    const role = Opal.hash_get(attrs, 'role')
    const blockId = Opal.hash_get(attrs, 'id')

    if (serverUrl) {
      const target = Opal.hash_get(attrs, 'target')
      const format = Opal.hash_get(attrs, 'format') || 'png'
      if (format === 'png' || format === 'svg') {
        const imageUrl = createImageSrc(doc, diagramText, target, format)
        const blockAttrs = {role: role ? `${role} plantuml` : 'plantuml', target: imageUrl, alt: target || 'diagram'}
        if (blockId) blockAttrs.id = blockId
        return this.createImageBlock(parent, blockAttrs)
      } else {
        console.warn(`Skipping plantuml block. Format ${format} is unsupported by PlantUML`)
        Opal.hash_put(attrs, 'role', role ? `${role} plantuml-error` : 'plantuml-error')
        return serverUnavailableBlock(this, parent, Opal.hash_get(attrs, 'cloaked-context'), diagramText, attrs)
      }
    } else {
      console.warn('Skipping plantuml block. PlantUML Server URL not defined in :plantuml-server-url: attribute.')
      Opal.hash_put(attrs, 'role', role ? `${role} plantuml-error` : 'plantuml-error')
      return serverUnavailableBlock(this, parent, Opal.hash_get(attrs, 'cloaked-context'), diagramText, attrs)
    }
  })
}

module.exports.register = function register (registry) {
  if (typeof registry.register === 'function') {
    registry.register(function () {
      this.block(plantumlBlock)
    })
  } else if (typeof registry.block === 'function') {
    registry.block(plantumlBlock)
  }
  return registry
}
