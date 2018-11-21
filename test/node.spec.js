/* eslint-env jasmine */
const fs = require('fs')
const tmp = require('tmp')
const path = require('path')
tmp.setGracefulCleanup()

const shared = require('./shared.js')
shared.run() // Run shared tests

describe('diagram fetching', () => {
  let src

  afterEach(() => {
    try {
      fs.unlinkSync(src)
    } catch (e) {
      // ignore
    }
  })

  for (let name in shared.FIXTURES) {
    const fixture = shared.FIXTURES[name]
    const inputFn = shared.asciidocContent(fixture)
    describe(fixture.title, () => {
      it('should by default fetch PNG when :plantuml-fetch-diagram: set', () => {
        const html = shared.toJQueryDOM(inputFn([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`, ':plantuml-fetch-diagram:']))

        src = html('.imageblock.plantuml img').attr('src')

        expect(src).toEndWith('.png')
        expect(path.basename(src)).toBe(src)
        expect(fs.existsSync(src)).toBe(true)
        expect(fs.statSync(src).size).toBe(fixture.pngSize)
      })

      it('should fetch PNG when positional attr :format: is png', () => {
        const html = shared.toJQueryDOM(inputFn([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`, ':plantuml-fetch-diagram:'], ['test,png']))

        src = html('.imageblock.plantuml img').attr('src')

        expect(src).toEndWith('.png')
        expect(path.basename(src)).toBe(src)
        expect(fs.existsSync(src)).toBe(true)
        expect(fs.statSync(src).size).toBe(fixture.pngSize)
      })

      // NOTE as of 15/11/2018, only png is supported (http://plantuml.com/ditaa)
      if (fixture.format !== 'ditaa') {
        it('should fetch SVG when positional attr :format: is svg', () => {
          const html = shared.toJQueryDOM(inputFn([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`, ':plantuml-fetch-diagram:'], ['test,svg']))

          src = html('.imageblock.plantuml img').attr('src')

          expect(src).toEndWith('.svg')
          expect(path.basename(src)).toBe(src)
          expect(fs.existsSync(src)).toBe(true)
          expect(fs.statSync(src).size).toBe(fixture.svgSize)
          const svgContent = fs.readFileSync(src, 'utf-8')
            .replace(/\r/gm, '')
            .replace(/\n$/, '') // remove trailing newline
          if (fixture.format === 'plantuml') {
            // NOTE when using the plantuml format, the svg file includes the source
            expect(svgContent).toContain(fixture.source)
          }
          expect(svgContent).toEndWith('</svg>')
        })
      }

      it('should fetch to named file when positional attr :target: is set', () => {
        const html = shared.toJQueryDOM(inputFn([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`, ':plantuml-fetch-diagram:'], ['myFile']))

        src = html('.imageblock.plantuml img').attr('src')

        expect(src).toBe('myFile.png')
        expect(path.basename(src)).toBe(src)
        expect(fs.existsSync(src)).toBe(true)
        expect(fs.statSync(src).size).toBe(fixture.pngSize)
      })

      it('should fetch to :imagesoutdir: if present and create nested folders', () => {
        const missingDir = path.join(tmp.dirSync({prefix: 'adoc_puml_'}).name, 'missing', 'dir')

        const html = shared.toJQueryDOM(inputFn([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`,
          ':plantuml-fetch-diagram:',
          `:imagesoutdir: ${missingDir}`
        ]))

        src = html('.imageblock.plantuml img').attr('src')

        expect(src).toEndWith('.png')
        expect(path.basename(src)).toBe(src)
        const diagramPath = path.format({dir: missingDir, base: src})
        expect(fs.existsSync(diagramPath)).toBe(true)
        expect(fs.statSync(diagramPath).size).toBe(fixture.pngSize)
      })

      it('should add :imagesdir: to image destination if present', () => {
        const html = shared.toJQueryDOM(inputFn([
          `:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`,
          ':plantuml-fetch-diagram:',
          ':imagesdir: _images'
        ]))

        src = html('.imageblock.plantuml img').attr('src')

        expect(src).toStartWith('_images')
        expect(src).toEndWith('.png')
        expect(fs.existsSync(src)).toBe(true)
        expect(fs.statSync(src).size).toBe(fixture.pngSize)
      })

      it('should use both :imagesoutdir: and :imagesdir: for fetching the image', () => {
        const dir = tmp.dirSync({prefix: 'adoc_puml_'}).name

        const html = shared.toJQueryDOM(inputFn([
          `:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`,
          ':plantuml-fetch-diagram:',
          `:imagesoutdir: ${dir}`,
          ':imagesdir: _images'
        ]))

        src = html('.imageblock.plantuml img').attr('src')
        expect(src).toStartWith('_images')
        expect(src).toEndWith('.png')
        const diagramPath = path.format({dir: dir, base: src})
        expect(fs.existsSync(diagramPath)).toBe(true)
        expect(fs.statSync(diagramPath).size).toBe(fixture.pngSize)
      })
    })
  }
})
