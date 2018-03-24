/* eslint-env jasmine */
const fs = require('fs')
const tmp = require('tmp')
const path = require('path')
tmp.setGracefulCleanup()

const shared = require('./shared.js')
shared.run() // Run shared tests

describe('conversion to HTML', () => {
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

    it('should fetch to named file when positional attr :target: is set', () => {
      const html = shared.toJQueryDOM(shared.asciidocContent([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`, ':plantuml-fetch-diagram:'], ['myFile']))

      src = html('.imageblock.plantuml img').attr('src')

      expect(src).toEndWith('myFile.png')
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
