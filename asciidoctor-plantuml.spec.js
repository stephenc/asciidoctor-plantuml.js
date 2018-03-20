/* eslint-env jasmine */
/* global Opal */
const LOCAL_URL = 'http://localhost:8080'
const PLANTUML_REMOTE_URL = 'http://www.plantuml.com/plantuml'
const DIAGRAM_SRC = `@startuml
alice -> bob
@enduml`

const DIAGRAM_SIZE = 1788

const plantuml = require('./asciidoctor-plantuml.js')
const asciidoctor = require('asciidoctor.js')()
const fs = require('fs')
const tmp = require('tmp')
const path = require('path')

tmp.setGracefulCleanup()

describe('extension registration', () => {
  let registry

  let registeredForBlock = () => Opal.send(registry, 'registered_for_block?', ['plantuml', 'listing'])

  beforeAll(() => (registry = asciidoctor.Extensions.create()))

  it('should register plantuml block for listing ctx', () => {
    expect(registeredForBlock).toThrowError(/undefined method/)
    plantuml.register(registry)
    expect(registeredForBlock()).not.toBeNull()
  })
})

describe('conversion to HTML', () => {
  const cheerio = require('cheerio')

  const plantumlEncoder = require('plantuml-encoder')

  const $$ = (doc) => cheerio.load(asciidoctor.convert(doc, {extension_registry: registry}))

  const ADOC = (docAttrs = [], blockAttrs = [], blockStyleModifiers = '') => {
    return `
${docAttrs.join('\n')}
[${['plantuml' + blockStyleModifiers].concat(blockAttrs || []).join(',')}]
----
${DIAGRAM_SRC}
----
`
  }

  let registry, encodedDiagram

  beforeAll(() => {
    registry = plantuml.register(asciidoctor.Extensions.create())
    encodedDiagram = plantumlEncoder.encode(DIAGRAM_SRC)
  })

  afterEach(() => delete process.env.PLANTUML_SERVER_URL)

  it('should create div[class="imageblock plantuml"] with img inside', () => {
    const root = $$(ADOC([`:plantuml-server-url: ${LOCAL_URL}`]))('.imageblock.plantuml')
    expect(root.find('div.content img').length).toBe(1)
  })

  describe('diagram attributes', () => {
    it('should populate id from named attr', () => {
      const imageBlock = $$(ADOC([`:plantuml-server-url: ${LOCAL_URL}`], ['id=myId']))('.imageblock.plantuml')
      expect(imageBlock.attr('id')).toBe('myId')
    })

    it('should populate id from block style modifier', () => {
      const imageBlock = $$(ADOC([`:plantuml-server-url: ${LOCAL_URL}`], [], '#myId'))('.imageblock.plantuml')
      expect(imageBlock.attr('id')).toBe('myId')
    })

    it('should populate role from named attr', () => {
      const imageBlock = $$(ADOC([`:plantuml-server-url: ${LOCAL_URL}`], ['role=sequence']))('.imageblock.plantuml')
      expect(imageBlock.attr('class')).toBe('imageblock sequence plantuml')
    })

    it('should populate role from block style modifier', () => {
      const imageBlock = $$(ADOC([`:plantuml-server-url: ${LOCAL_URL}`], [], '.sequence'))('.imageblock.plantuml')
      expect(imageBlock.attr('class')).toBe('imageblock sequence plantuml')
    })

    it('should set alt attribute on image', () => {
      const img = $$(ADOC([`:plantuml-server-url: ${LOCAL_URL}`]))('.imageblock.plantuml img')
      expect(img.attr('alt')).toBe('diagram')
    })
  })

  describe('PlantUML server URL', () => {
    it('should use :plantuml-server-url: for diagram src', () => {
      const src = $$(ADOC([`:plantuml-server-url: ${LOCAL_URL}`]))('.imageblock.plantuml img').attr('src')
      expect(src).toBe(`${LOCAL_URL}/png/${encodedDiagram}`)
    })

    it('when :plantuml-server-url: missing then use PLANTUML_SERVER_URL', () => {
      process.env.PLANTUML_SERVER_URL = PLANTUML_REMOTE_URL
      const src = $$(ADOC())('.imageblock.plantuml img').attr('src')
      expect(src).toBe(`${PLANTUML_REMOTE_URL}/png/${encodedDiagram}`)
    })

    it('PLANTUML_SERVER_URL should override :plantuml-server-url:', () => {
      process.env.PLANTUML_SERVER_URL = PLANTUML_REMOTE_URL
      const src = $$(ADOC([`:plantuml-server-url: ${LOCAL_URL}`]))('.imageblock.plantuml img').attr('src')
      expect(src).toBe(`${PLANTUML_REMOTE_URL}/png/${encodedDiagram}`)
    })

    it('should generate HTML error when no :plantuml-server-url: and no PLANTUML_SERVER_URL', () => {
      const listingBlock = $$(ADOC())('.listingblock.plantuml-error')
      expect(listingBlock.find('img').length).toBe(0)
      expect(listingBlock.text()).toContain('@startuml')
    })
  })

  describe('diagram fetching', () => {
    let src

    afterEach(() => {
      try {
        fs.unlinkSync(src)
      } catch (e) {
        // ignore
      }
    })

    it('should fetch when :plantuml-fetch-diagram: set', () => {
      const html = $$(ADOC([`:plantuml-server-url: ${PLANTUML_REMOTE_URL}`, ':plantuml-fetch-diagram:']))

      src = html('.imageblock.plantuml img').attr('src')

      expect(src).toEndWith('.png')

      expect(fs.existsSync(src)).toBe(true)
      expect(fs.statSync(src).size).toBe(DIAGRAM_SIZE)
    })

    it('should support :imagesoutdir: for storing images', () => {
      const tmpDir = tmp.dirSync({prefix: 'adoc_puml_'})

      const html = $$(ADOC([`:plantuml-server-url: ${PLANTUML_REMOTE_URL}`,
        ':plantuml-fetch-diagram:',
        `:imagesoutdir: ${tmpDir.name}`
      ]))

      src = html('.imageblock.plantuml img').attr('src')

      expect(src).toEndWith('.png')

      const diagramPath = path.format({dir: tmpDir.name, base: src})

      expect(fs.existsSync(diagramPath)).toBe(true)
      expect(fs.statSync(diagramPath).size).toBe(DIAGRAM_SIZE)
    })

    it('should create nested subdirectories of :imagesoutdir:', () => {
      const missingDir = path.join(tmp.dirSync({prefix: 'adoc_puml_'}).name, 'missing', 'dir')

      const html = $$(ADOC([`:plantuml-server-url: ${PLANTUML_REMOTE_URL}`,
        ':plantuml-fetch-diagram:',
        `:imagesoutdir: ${missingDir}`
      ]))

      src = html('.imageblock.plantuml img').attr('src')

      expect(src).toEndWith('.png')

      const diagramPath = path.format({dir: missingDir, base: src})

      expect(fs.existsSync(diagramPath)).toBe(true)
      expect(fs.statSync(diagramPath).size).toBe(DIAGRAM_SIZE)
    })
  })
})
