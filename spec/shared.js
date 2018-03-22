/* eslint-env jasmine */
/* global Opal */
const asciidoctorPlantuml = require('../asciidoctor-plantuml.js')
const plantumlEncoder = require('plantuml-encoder')
const asciidoctor = require('asciidoctor.js')()
const cheerio = require('cheerio')

const registry = asciidoctorPlantuml.register(asciidoctor.Extensions.create())

// Namespace
const sharedSpec = {}

sharedSpec.DIAGRAM_SRC = `@startuml
alice -> bob
@enduml`
sharedSpec.LOCAL_URL = 'http://localhost:8080'
sharedSpec.PLANTUML_REMOTE_URL = 'http://www.plantuml.com/plantuml'
sharedSpec.DIAGRAM_SIZE = 1788
sharedSpec.encodedDiagram = plantumlEncoder.encode(sharedSpec.DIAGRAM_SRC)

/**
 * Convert an AsciiDoc content to a "JQuery" DOM
 * @param asciidocContent
 */
sharedSpec.toJQueryDOM = (asciidocContent) => cheerio.load(asciidoctor.convert(asciidocContent, {extension_registry: registry}))

/**
 * Generate an AsciiDoc content containing a PlantUML diagram
 * @returns {string}
 */
sharedSpec.asciidocContent = (docAttrs = [], blockAttrs = [], blockStyleModifiers = '') => `
${docAttrs.join('\n')}
[${['plantuml' + blockStyleModifiers].concat(blockAttrs || []).join(',')}]
----
${sharedSpec.DIAGRAM_SRC}
----
`
/**
 * Run the tests
 */
sharedSpec.run = function () {
  describe('extension registration', () => {
    let registry

    let registeredForBlock = () => Opal.send(registry, 'registered_for_block?', ['plantuml', 'listing'])

    beforeAll(() => (registry = asciidoctor.Extensions.create()))

    it('should register plantuml block for listing ctx', () => {
      expect(registeredForBlock).toThrowError(/undefined method/)
      asciidoctorPlantuml.register(registry)
      expect(registeredForBlock()).not.toBeNull()
    })
  })

  describe('conversion to HTML', () => {
    let encodedDiagram = plantumlEncoder.encode(sharedSpec.DIAGRAM_SRC)

    it('should create div[class="imageblock plantuml"] with img inside', () => {
      const root = sharedSpec.toJQueryDOM(sharedSpec.asciidocContent([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`]))('.imageblock.plantuml')
      expect(root.find('div.content img').length).toBe(1)
    })

    describe('diagram attributes', () => {
      it('should populate id from named attr', () => {
        const imageBlock = sharedSpec.toJQueryDOM(sharedSpec.asciidocContent([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], ['id=myId']))('.imageblock.plantuml')
        expect(imageBlock.attr('id')).toBe('myId')
      })

      it('should populate id from block style modifier', () => {
        const imageBlock = sharedSpec.toJQueryDOM(sharedSpec.asciidocContent([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], [], '#myId'))('.imageblock.plantuml')
        expect(imageBlock.attr('id')).toBe('myId')
      })

      it('should populate role from named attr', () => {
        const imageBlock = sharedSpec.toJQueryDOM(sharedSpec.asciidocContent([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], ['role=sequence']))('.imageblock.plantuml')
        expect(imageBlock.attr('class')).toBe('imageblock sequence plantuml')
      })

      it('should populate role from block style modifier', () => {
        const imageBlock = sharedSpec.toJQueryDOM(sharedSpec.asciidocContent([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], [], '.sequence'))('.imageblock.plantuml')
        expect(imageBlock.attr('class')).toBe('imageblock sequence plantuml')
      })

      it('should set alt attribute on image', () => {
        const img = sharedSpec.toJQueryDOM(sharedSpec.asciidocContent([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`]))('.imageblock.plantuml img')
        expect(img.attr('alt')).toBe('diagram')
      })
    })

    describe('PlantUML server URL', () => {
      it('should use :plantuml-server-url: for diagram src', () => {
        const src = sharedSpec.toJQueryDOM(sharedSpec.asciidocContent([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`]))('.imageblock.plantuml img').attr('src')
        expect(src).toBe(`${sharedSpec.LOCAL_URL}/png/${encodedDiagram}`)
      })

      it('should generate HTML error when no :plantuml-server-url: and no PLANTUML_SERVER_URL', () => {
        const listingBlock = sharedSpec.toJQueryDOM(sharedSpec.asciidocContent())('.listingblock.plantuml-error')
        expect(listingBlock.find('img').length).toBe(0)
        expect(listingBlock.text()).toContain('@startuml')
      })
    })
  })
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = sharedSpec
}
