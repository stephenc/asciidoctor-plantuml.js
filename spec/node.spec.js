/* eslint-env jasmine */
const fs = require('fs')
const tmp = require('tmp')
const path = require('path')

tmp.setGracefulCleanup()

const shared = require('./shared.js')
shared.run() // Run shared tests

describe('conversion to HTML', () => {
  afterEach(() => delete process.env.PLANTUML_SERVER_URL)

  describe('PlantUML server URL', () => {
    it('when :plantuml-server-url: missing then use PLANTUML_SERVER_URL', () => {
      process.env.PLANTUML_SERVER_URL = shared.PLANTUML_REMOTE_URL
      const src = shared.toJQueryDOM(shared.asciidocContent())('.imageblock.plantuml img').attr('src')
      expect(src).toBe(`${shared.PLANTUML_REMOTE_URL}/png/${shared.encodedDiagram}`)
    })

    it('PLANTUML_SERVER_URL should override :plantuml-server-url:', () => {
      process.env.PLANTUML_SERVER_URL = shared.PLANTUML_REMOTE_URL
      const src = shared.toJQueryDOM(shared.asciidocContent([`:plantuml-server-url: ${shared.LOCAL_URL}`]))('.imageblock.plantuml img').attr('src')
      expect(src).toBe(`${shared.PLANTUML_REMOTE_URL}/png/${shared.encodedDiagram}`)
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
      const html = shared.toJQueryDOM(shared.asciidocContent([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`, ':plantuml-fetch-diagram:']))

      src = html('.imageblock.plantuml img').attr('src')

      expect(src).toEndWith('.png')
      expect(fs.existsSync(src)).toBe(true)
      expect(fs.statSync(src).size).toBe(shared.DIAGRAM_SIZE)
    })

    it('should support :imagesoutdir: for storing images', () => {
      const tmpDir = tmp.dirSync({prefix: 'adoc_puml_'})

      const html = shared.toJQueryDOM(shared.asciidocContent([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`,
        ':plantuml-fetch-diagram:',
        `:imagesoutdir: ${tmpDir.name}`
      ]))

      src = html('.imageblock.plantuml img').attr('src')

      expect(src).toEndWith('.png')
      const diagramPath = path.format({dir: tmpDir.name, base: src})
      expect(fs.existsSync(diagramPath)).toBe(true)
      expect(fs.statSync(diagramPath).size).toBe(shared.DIAGRAM_SIZE)
    })

    it('should create nested subdirectories of :imagesoutdir:', () => {
      const missingDir = path.join(tmp.dirSync({prefix: 'adoc_puml_'}).name, 'missing', 'dir')

      const html = shared.toJQueryDOM(shared.asciidocContent([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`,
        ':plantuml-fetch-diagram:',
        `:imagesoutdir: ${missingDir}`
      ]))

      src = html('.imageblock.plantuml img').attr('src')

      expect(src).toEndWith('.png')
      const diagramPath = path.format({dir: missingDir, base: src})
      expect(fs.existsSync(diagramPath)).toBe(true)
      expect(fs.statSync(diagramPath).size).toBe(shared.DIAGRAM_SIZE)
    })
  })
})
