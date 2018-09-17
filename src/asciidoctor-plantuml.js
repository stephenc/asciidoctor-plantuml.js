/* global Opal */
const plantumlEncoder = require('plantuml-encoder')

function serverUnavailableBlock (processor, parent, context, source, attrs) {
  return processor.createBlock(parent, context, source, attrs)
}

function calcImageUrl(doc, text, format) {
  const serverUrl = doc.getAttribute('plantuml-server-url')
  return `${serverUrl}/${format}/${plantumlEncoder.encode(text)}`
}

function createImageSrc (doc, text, target, format) {
  const shouldFetch = doc.isAttribute('plantuml-fetch-diagram')
  let diagramUrl = calcImageUrl(doc, text, format)
  if (shouldFetch) {
    let fetch = require('./fetch');
    diagramUrl = fetch.save(diagramUrl, doc, fetch.name(text, target, format))
  }
  return diagramUrl
}

function generatePlantumlBlock (context) {
  return function() {
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
          const shouldFetch = doc.isAttribute('plantuml-fetch-diagram')
          if (shouldFetch && context && ('file' in context)) {
            // We're inside Antora when context has file property
            const { component, version, module } = context.file.src
            const fetch = require('./fetch')
            const generatedImagePath = fetch.name(diagramText, target, format)
            context.contentCatalog.addFile({
              contents: Buffer.from(fetch.get(calcImageUrl(doc, diagramText, format))),
              src: {
                component,
                version,
                module,
                family: 'image',
                mediaType: format === 'svg' ? 'image/svg+xml' : 'image/png',
                basename: generatedImagePath,
                relative: generatedImagePath
              }
            })
            const blockAttrs = {role: role ? `${role} plantuml` : 'plantuml', target: generatedImagePath, alt: target || 'diagram'}
            if (blockId) blockAttrs.id = blockId
            return this.createBlock(parent, 'image', undefined, blockAttrs);
          } else {
            const imageUrl = createImageSrc(doc, diagramText, target, format)
            const blockAttrs = {role: role ? `${role} plantuml` : 'plantuml', target: imageUrl, alt: target || 'diagram'}
            if (blockId) blockAttrs.id = blockId
            return this.createImageBlock(parent, blockAttrs)
          }
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
}

function register (registry, context) {
  if (typeof registry.register === 'function') {
    registry.register(function () {
      this.block(generatePlantumlBlock(context))
    })
  } else if (typeof registry.block === 'function') {
    registry.block(generatePlantumlBlock(context))
  }
  return registry
}

module.exports = generatePlantumlBlock
module.exports.register = register
