/* eslint-env jasmine */
const fs = require('fs')
const tmp = require('tmp')
const path = require('path')

const hasha = require('hasha')
const png = require('./png-metadata.js')
const cheerio = require('cheerio')
const asciidoctorPlantuml = require('../src/asciidoctor-plantuml.js')
const asciidoctor = require('asciidoctor.js')()
tmp.setGracefulCleanup()

const shared = require('./shared.js')
shared.run() // Run shared tests

const md5sum = str => {
  return hasha(png.removeAncillaryChunks(str), {algorithm: 'md5'})
}

describe('diagram fetching', () => {
  let src

  afterEach(() => {
    try {
      fs.unlinkSync(src)
    } catch (e) {
      // ignore
    }
  })

  describe('virtual file system', () => {
    it('should fetch an image and add it to the VFS', () => {
      const catalog = []
      const registry = asciidoctorPlantuml.register(asciidoctor.Extensions.create(), {
        vfs: {
          add: (image) => {
            catalog.push(image)
          }
        }
      })
      const fixture = shared.FIXTURES.plantumlWithStartEndDirectives
      const inputFn = shared.asciidocContent(fixture)
      const input = inputFn([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`, ':plantuml-fetch-diagram:'])
      asciidoctor.convert(input, {extension_registry: registry})
      expect(catalog.length).toBe(1)
      expect(catalog[0].basename).toEndWith('.png') // REMIND: basename is a random string
      expect(catalog[0].relative).toBe('.')
      expect(catalog[0].mediaType).toBe('image/png')
      const hash = md5sum(catalog[0].contents.toString('binary'), {algorithm: 'md5'})
      expect(hash).toBe(fixture.pngHash)
    })

    it('should get a target diagram using the VFS', () => {
      const cache = {
        'alice-bob.puml': `@startuml
alice -> bob
@enduml
`
      }
      const registry = asciidoctorPlantuml.register(asciidoctor.Extensions.create(), {
        vfs: {
          read: (target) => {
            return cache[target]
          }
        }
      })
      const html = asciidoctor.convert(`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}

plantuml::alice-bob.puml[format=png]`, {extension_registry: registry})

      const src = cheerio.load(html)('.imageblock.plantuml img').attr('src')
      expect(src).toBe('http://www.plantuml.com/plantuml/png/SoWkIImgAStDuNA0in9pCfDJ5NJj59BoaxWSKlDIG88m1W00')
    })
  })

  describe('block macro', () => {
    it('should resolve the plantuml block macro', () => {
      const registry = asciidoctorPlantuml.register(asciidoctor.Extensions.create())
      const html = asciidoctor.convert(`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}

plantuml::${__dirname}/fixtures/alice-bob.puml[format=png]`, {extension_registry: registry})

      const src = cheerio.load(html)('.imageblock.plantuml img').attr('src')
      expect(src).toBe('http://www.plantuml.com/plantuml/png/SoWkIImgAStDuNA0in9pCfDJ5NJj59BoaxWSKlDIG88m1W00')
    })

    it('should resolve the plantuml block macro target (substitutes attributes)', () => {
      const registry = asciidoctorPlantuml.register(asciidoctor.Extensions.create())
      const html = asciidoctor.convert(`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}
:diagramsdir: ${__dirname}/fixtures

plantuml::{diagramsdir}/alice-bob.puml[format=png]`, {extension_registry: registry})

      const src = cheerio.load(html)('.imageblock.plantuml img').attr('src')
      expect(src).toBe('http://www.plantuml.com/plantuml/png/SoWkIImgAStDuNA0in9pCfDJ5NJj59BoaxWSKlDIG88m1W00')
    })

    it('should resolve the ditaa block macro', () => {
      const registry = asciidoctorPlantuml.register(asciidoctor.Extensions.create())
      const html = asciidoctor.convert(`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}

ditaa::${__dirname}/fixtures/app.ditaa[format=svg]`, {extension_registry: registry})

      const src = cheerio.load(html)('.imageblock.plantuml img').attr('src')
      expect(src).toBe('http://www.plantuml.com/plantuml/svg/SoWkIImgISaiIKpaqjQ50sq51GKaBaY4goRPqT5H0Gnge1W1QhYG-DfW4nmB2d8oanDBClFpmD8kYIM9IOd5gSYwauDSNQfJQX6wgujhQx3OZUmqBYw7rBmKi9C1')
    })

    it('should resolve the graphviz block macro', () => {
      const registry = asciidoctorPlantuml.register(asciidoctor.Extensions.create())
      const html = asciidoctor.convert(`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}

graphviz::${__dirname}/fixtures/nodes.dot[format=png]`, {extension_registry: registry})

      const src = cheerio.load(html)('.imageblock.plantuml img').attr('src')
      expect(src).toBe('http://www.plantuml.com/plantuml/png/FO_13e8m38RlUufcPpmevndUWt0OQv4bTILZHWdoxauT79eqN_hzRPivsPXGaa9_YtOQOH21LG44GO9sJWkJYV88IDWLVCvyj1EPNbuxkq0xU6OdBD4in2pF2lwsBdhr7I3KcVzizFOkuKYjzzH8JY9MmBOdDde52s_eSpdOTAUE8qxNihaqjTgKQYXWVkS3')
    })
  })

  for (let name in shared.FIXTURES) {
    const fixture = shared.FIXTURES[name]
    const inputFn = shared.asciidocContent(fixture)
    describe(fixture.title, () => {
      it('should by default fetch PNG when :plantuml-fetch-diagram: set', () => {
        const html = shared.toJQueryDOM(inputFn([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`, ':plantuml-fetch-diagram:']))

        src = html('.imageblock.plantuml img').attr('src')
        expect(src).toEndWith('.png')
        expect(src).toBe(`${fixture.basenameHash}.png`)
        expect(path.basename(src)).toBe(src)
        expect(fs.existsSync(src)).toBe(true)
        const hash = md5sum(fs.readFileSync(src, 'binary'))
        expect(hash).toBe(fixture.pngHash)
      })

      it('should fetch PNG when positional attr :format: is png', () => {
        const html = shared.toJQueryDOM(inputFn([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`, ':plantuml-fetch-diagram:'], ['test,png']))

        src = html('.imageblock.plantuml img').attr('src')

        expect(src).toBe('test.png')
        expect(path.basename(src)).toBe(src)
        expect(fs.existsSync(src)).toBe(true)
        const hash = md5sum(fs.readFileSync(src, 'binary'))
        expect(hash).toBe(fixture.pngHash)
      })

      // NOTE as of 15/11/2018, only png is supported (http://plantuml.com/ditaa)
      if (fixture.format !== 'ditaa') {
        it('should fetch SVG when positional attr :format: is svg', async () => {
          const html = shared.toJQueryDOM(inputFn([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`, ':plantuml-fetch-diagram:'], ['test,svg']))

          src = html('.imageblock.plantuml img').attr('src')

          expect(src).toBe('test.svg')
          expect(path.basename(src)).toBe(src)
          expect(fs.existsSync(src)).toBe(true)

          const data = fs.readFileSync(src, 'utf8')
            // remove comments (otherwise the md5sum won't be stable)
            .replace(/<!--[\s\S]*?-->/g, '')
          const hash = hasha(data, {algorithm: 'md5'})
          expect(hash).toBe(fixture.svgHash)
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
        const hash = md5sum(fs.readFileSync(src, 'binary'))
        expect(hash).toBe(fixture.pngHash)
      })

      it('should fetch to :imagesoutdir: if present and create nested folders', async () => {
        const missingDir = path.join(tmp.dirSync({prefix: 'adoc_puml_'}).name, 'missing', 'dir')

        const html = shared.toJQueryDOM(inputFn([`:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`,
          ':plantuml-fetch-diagram:',
          `:imagesoutdir: ${missingDir}`
        ]))

        src = html('.imageblock.plantuml img').attr('src')

        expect(src).toEndWith('.png')
        expect(src).toBe(`${fixture.basenameHash}.png`)
        expect(path.basename(src)).toBe(src)
        const diagramPath = path.format({dir: missingDir, base: src})
        expect(fs.existsSync(diagramPath)).toBe(true)
        const hash = md5sum(fs.readFileSync(diagramPath, 'binary'))
        expect(hash).toBe(fixture.pngHash)
      })

      it('should add :imagesdir: to image destination if present', async () => {
        const html = shared.toJQueryDOM(inputFn([
          `:plantuml-server-url: ${shared.PLANTUML_REMOTE_URL}`,
          ':plantuml-fetch-diagram:',
          ':imagesdir: _images'
        ]))

        src = html('.imageblock.plantuml img').attr('src')

        expect(src).toStartWith('_images')
        expect(src).toEndWith('.png')
        expect(path.basename(src)).toBe(`${fixture.basenameHash}.png`)
        expect(fs.existsSync(src)).toBe(true)
        const hash = md5sum(fs.readFileSync(src, 'binary'))
        expect(hash).toBe(fixture.pngHash)
      })

      it('should use both :imagesoutdir: and :imagesdir: for fetching the image', async () => {
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
        expect(path.basename(src)).toBe(`${fixture.basenameHash}.png`)
        const diagramPath = path.format({dir: dir, base: src})
        expect(fs.existsSync(diagramPath)).toBe(true)
        const hash = md5sum(fs.readFileSync(diagramPath, 'binary'))
        expect(hash).toBe(fixture.pngHash)
      })
    })
  }
})
