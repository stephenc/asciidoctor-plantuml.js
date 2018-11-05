const plantumlEncoder = require('plantuml-encoder')

/**
 * Convert an (Opal) Hash to JSON.
 * @private
 */
const fromHash = function (hash) {
  const object = {}
  const data = hash.$$smap
  for (let key in data) {
    object[key] = data[key]
  }
  return object
}

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
    if (typeof attrs === 'object' && '$$smap' in attrs) {
      attrs = fromHash(attrs)
    }
    const doc = parent.getDocument()
    const diagramText = reader.getString()
    const serverUrl = doc.getAttribute('plantuml-server-url')
    const role = attrs.role
    const blockId = attrs.id

    if (serverUrl) {
      const target = attrs.target
      const format = attrs.format || 'png'
      if (format === 'png' || format === 'svg') {
        const imageUrl = createImageSrc(doc, diagramText, target, format)
        const blockAttrs = {role: role ? `${role} plantuml` : 'plantuml', target: imageUrl, alt: target || 'diagram'}
        if (blockId) blockAttrs.id = blockId
        return this.createImageBlock(parent, blockAttrs)
      } else {
        console.warn(`Skipping plantuml block. Format ${format} is unsupported by PlantUML`)
        attrs.role = role ? `${role} plantuml-error` : 'plantuml-error'
        return serverUnavailableBlock(this, parent, attrs['cloaked-context'], diagramText, attrs)
      }
    } else {
      console.warn('Skipping plantuml block. PlantUML Server URL not defined in :plantuml-server-url: attribute.')
      attrs.role = role ? `${role} plantuml-error` : 'plantuml-error'
      return serverUnavailableBlock(this, parent, attrs['cloaked-context'], diagramText, attrs)
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
