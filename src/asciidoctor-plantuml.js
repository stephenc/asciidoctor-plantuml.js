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

function createImageSrc (context, doc, text, target, format) {
  const serverUrl = doc.getAttribute('plantuml-server-url')
  const shouldFetch = doc.isAttribute('plantuml-fetch-diagram')
  let diagramUrl = `${serverUrl}/${format}/${plantumlEncoder.encode(text)}`
  if (shouldFetch) {
    let fetch = require('./fetch')
    let diagramName = fetch.name(text, target, format)
    if (context && ('file' in context)) {
      // We're inside Antora when context has `file` property
      const { component, version, module } = context.file.src
      context.contentCatalog.addFile({
        contents: Buffer.from(fetch.get(diagramUrl)),
        src: {
          component,
          version,
          module,
          family: 'image',
          mediaType: format === 'svg' ? 'image/svg+xml' : 'image/png',
          basename: diagramName,
          relative: diagramName
        }
      })
      diagramUrl = diagramName
    } else {
      diagramUrl = fetch.save(diagramUrl, doc, diagramName)
    }
  }
  return diagramUrl
}

function generatePlantumlBlock (context) {
  return function () {
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
      const title = attrs.title

      if (serverUrl) {
        const target = attrs.target
        const format = attrs.format || 'png'
        if (format === 'png' || format === 'svg') {
          const imageUrl = createImageSrc(context, doc, diagramText, target, format)
          const blockAttrs = {role: role ? `${role} plantuml` : 'plantuml', target: imageUrl, alt: target || 'diagram', title}
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
}

module.exports.register = function register (registry, context) {
  if (typeof registry.register === 'function') {
    registry.register(function () {
      this.block('plantuml', generatePlantumlBlock(context))
      this.block('ditaa', generatePlantumlBlock(context))
      this.block('graphviz', generatePlantumlBlock(context))
    })
  } else if (typeof registry.block === 'function') {
    registry.block('plantuml', generatePlantumlBlock(context))
    registry.block('ditaa', generatePlantumlBlock(context))
    registry.block('graphviz', generatePlantumlBlock(context))
  }
  return registry
}
