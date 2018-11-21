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
  this.onContext(['listing', 'literal'])
  this.positionalAttributes(['target', 'format'])

  this.process((parent, reader, attrs) => {
    if (typeof attrs === 'object' && '$$smap' in attrs) {
      attrs = fromHash(attrs)
    }
    const doc = parent.getDocument()
    const diagramType = this.name.toString()
    let diagramText = reader.getString()
    if (!/^@start([a-z]+)\n[\s\S]*\n@end\1$/.test(diagramText)) {
      if (diagramType === 'plantuml') {
        diagramText = '@startuml\n' + diagramText + '\n@enduml'
      } else if (diagramType === 'ditaa') {
        diagramText = '@startditaa\n' + diagramText + '\n@endditaa'
      } else if (diagramType === 'graphviz') {
        diagramText = '@startdot\n' + diagramText + '\n@enddot'
      }
    }
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
      this.block('plantuml', plantumlBlock)
      this.block('ditaa', plantumlBlock)
      this.block('graphviz', plantumlBlock)
    })
  } else if (typeof registry.block === 'function') {
    registry.block('plantuml', plantumlBlock)
    registry.block('ditaa', plantumlBlock)
    registry.block('graphviz', plantumlBlock)
  }
  return registry
}
