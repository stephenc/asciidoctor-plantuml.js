/* eslint-env jasmine */
/* global Opal */
const asciidoctorPlantuml = require('../src/asciidoctor-plantuml.js')
const plantumlEncoder = require('plantuml-encoder')
const asciidoctor = require('asciidoctor.js')()
const cheerio = require('cheerio')

const registry = asciidoctorPlantuml.register(asciidoctor.Extensions.create())

// Namespace
const sharedSpec = {}

sharedSpec.FIXTURES = {
  plantumlWithStartEndDirectives: {
    title: 'PlantUML with start/end directives',
    source: `@startuml
alice -> bob
@enduml`,
    pngHash: '5df44d9d739236262f5746860182827e',
    svgHash: '06c71ae4ec8e45fd06f1def8ac0c2e2a',
    hasStartEndDirectives: true,
    format: 'plantuml'
  },
  plantuml: {
    title: 'PlantUML without start/end directives',
    source: `
alice -> bob
bob ..> alice
`,
    pngHash: '5894d1cd6f399cf084b18be8e4010c50',
    svgHash: 'ae2b19469c19be7e61ff88f9696cb159',
    hasStartEndDirectives: false,
    format: 'plantuml'
  },
  ditaa: {
    title: 'Ditaa without start/end directives',
    source: `
+----------+   +-------------+
|cAAA      |   |             |
|          +---+ Application |
| Database |   |      cRED{d}|
|       {s}|   +-------------+
+----------+
`,
    pngHash: '4849113f73546151997ea02cf32831d5',
    hasStartEndDirectives: false,
    format: 'ditaa'
  },
  graphviz: {
    title: 'Graphviz without start/end directives',
    source: `
digraph foo {
  node [style=rounded]
  node1 [shape=box]
  node2 [fillcolor=yellow, style="rounded,filled", shape=diamond]
  node3 [shape=record, label="{ a | b | c }"]

  node1 -> node2 -> node3
}
`,
    pngHash: '630e0e1b38a2334468af5b6d489d73b7',
    svgHash: '2e12082a2099d334ca8f306e06f77f52',
    hasStartEndDirectives: false,
    format: 'graphviz'
  }
}

sharedSpec.LOCAL_URL = 'http://localhost:8080'
sharedSpec.PLANTUML_REMOTE_URL = 'http://www.plantuml.com/plantuml'

/**
 * Convert an AsciiDoc content to a "JQuery" DOM
 * @param asciidocContent
 */
sharedSpec.toJQueryDOM = (asciidocContent) => cheerio.load(asciidoctor.convert(asciidocContent, {extension_registry: registry}))

/**
 * Generate an AsciiDoc content containing a PlantUML diagram
 * @returns {function(*=, *=, *=, *=): string}
 */
sharedSpec.asciidocContent = (fixture) => (docAttrs = [], blockAttrs = [], blockStyleModifiers = '', blockDelimiter = '----') => `
${docAttrs.join('\n')}
[${[fixture.format + blockStyleModifiers].concat(blockAttrs || []).join(',')}]
${blockDelimiter}
${fixture.source}
${blockDelimiter}
`

/**
 * Get the start and end directives.
 * @param fixture
 */
sharedSpec.getDirectives = (fixture) => {
  let result = {}
  switch (fixture.format) {
    case 'plantuml':
      result.start = '@startuml'
      result.end = '@enduml'
      break
    case 'graphviz':
      result.start = '@startdot'
      result.end = '@enddot'
      break
    default:
      result.start = `@start${fixture.format}`
      result.end = `@end${fixture.format}`
  }
  return result
}

/**
 * Run the tests
 */
sharedSpec.run = function () {
  describe('extension registration', () => {
    for (let name of ['plantuml', 'ditaa', 'graphviz']) {
      let registry

      let registeredForBlock = (context) => Opal.send(registry, 'registered_for_block?', [name, context])

      beforeEach(() => (registry = asciidoctor.Extensions.create()))

      it(`should register ${name} style for listing block`, () => {
        expect(() => registeredForBlock('listing')).toThrowError(/undefined method/)
        asciidoctorPlantuml.register(registry)
        expect(registeredForBlock('listing')).not.toBeNull()
      })

      it(`should register ${name} style for literal block`, () => {
        expect(() => registeredForBlock('literal')).toThrowError(/undefined method/)
        asciidoctorPlantuml.register(registry)
        expect(registeredForBlock('literal')).not.toBeNull()
      })
    }
  })

  describe('conversion to HTML', () => {
    describe('substitutions', () => {
      const fixture = {
        title: 'PlantUML with attributes',
        source: `@startuml
{first-actor-name} -> {second-actor-name}
@enduml`,
        format: 'plantuml'
      }
      it('should apply substitutions', () => {
        const encodedDiagram = plantumlEncoder.encode(`@startuml
Guillaume -> Evgeny
@enduml`)
        const inputFn = sharedSpec.asciidocContent(fixture)
        const attributes = [
          `:plantuml-server-url: ${sharedSpec.LOCAL_URL}`,
          ':first-actor-name: Guillaume',
          ':second-actor-name: Evgeny',
          '[subs=attributes]'
        ]
        const src = sharedSpec.toJQueryDOM(inputFn(attributes, ['format=svg']))('.imageblock.plantuml img').attr('src')
        expect(src).toBe(`${sharedSpec.LOCAL_URL}/svg/${encodedDiagram}`)
      })
      it('should not apply substitutions', () => {
        const encodedDiagram = plantumlEncoder.encode(fixture.source)
        const inputFn = sharedSpec.asciidocContent(fixture)
        const attributes = [
          `:plantuml-server-url: ${sharedSpec.LOCAL_URL}`,
          ':first-actor-name: Guillaume',
          ':second-actor-name: Evgeny'
        ]
        const src = sharedSpec.toJQueryDOM(inputFn(attributes, ['format=svg']))('.imageblock.plantuml img').attr('src')
        expect(src).toBe(`${sharedSpec.LOCAL_URL}/svg/${encodedDiagram}`)
      })
    })
    for (let name in sharedSpec.FIXTURES) {
      const fixture = sharedSpec.FIXTURES[name]
      describe(fixture.title, () => {
        const source = fixture.source
        const inputFn = sharedSpec.asciidocContent(fixture)
        const directives = sharedSpec.getDirectives(fixture)
        const startDirective = directives.start
        const endDirective = directives.end
        const encodedDiagram = fixture.hasStartEndDirectives ? plantumlEncoder.encode(source) : plantumlEncoder.encode(`${startDirective}\n${source}\n${endDirective}`)

        it('should create div[class="imageblock plantuml"] with img inside from listing block', () => {
          const input = inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`])
          const root = sharedSpec.toJQueryDOM(input)('.imageblock.plantuml')
          expect(root.find('div.content img').length).toBe(1)
        })

        it('should create div[class="imageblock plantuml"] with img inside from literal block', () => {
          const root = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], [], '', '....'))('.imageblock.plantuml')
          expect(root.find('div.content img').length).toBe(1)
        })

        describe('diagram attributes', () => {
          it('should populate id from named attr', () => {
            const imageBlock = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], ['id=myId']))('.imageblock.plantuml')
            expect(imageBlock.attr('id')).toBe('myId')
          })

          it('should populate id from block style modifier', () => {
            const imageBlock = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], [], '#myId'))('.imageblock.plantuml')
            expect(imageBlock.attr('id')).toBe('myId')
          })

          it('should populate role from named attr', () => {
            const imageBlock = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], ['role=sequence']))('.imageblock.plantuml')
            expect(imageBlock.attr('class')).toBe('imageblock sequence plantuml')
          })

          it('should populate role from block style modifier', () => {
            const imageBlock = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], [], '.sequence'))('.imageblock.plantuml')
            expect(imageBlock.attr('class')).toBe('imageblock sequence plantuml')
          })

          it('should set alt attribute on image', () => {
            const img = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`]))('.imageblock.plantuml img')
            expect(img.attr('alt')).toBe('diagram')
          })

          it('should set alt attribute on image from positional attr :target:', () => {
            const img = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], ['myFile']))('.imageblock.plantuml img')
            expect(img.attr('alt')).toBe('myFile')
          })

          it('should set title on image', () => {
            const title = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`, '.Sample diagram'], ['myFile']))('.imageblock.plantuml .title')
            expect(title.text()).toBe('Sample diagram')
          })
        })

        describe('PlantUML server URL', () => {
          it('should use :plantuml-server-url: for diagram src', () => {
            const src = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`]))('.imageblock.plantuml img').attr('src')
            expect(src).toBe(`${sharedSpec.LOCAL_URL}/png/${encodedDiagram}`)
          })

          if (fixture.hasStartEndDirectives) {
            it('should generate HTML error when no :plantuml-server-url: and no PLANTUML_SERVER_URL for listing block', () => {
              const listingBlock = sharedSpec.toJQueryDOM(inputFn())('.listingblock.plantuml-error')
              expect(listingBlock.find('img').length).toBe(0)
              expect(listingBlock.text()).toContain(startDirective)
            })

            it('should generate HTML error when no :plantuml-server-url: and no PLANTUML_SERVER_URL for literal', () => {
              const literalBlock = sharedSpec.toJQueryDOM(inputFn([], [], '', '....'))('.literalblock.plantuml-error')
              expect(literalBlock.find('img').length).toBe(0)
              expect(literalBlock.text()).toContain(startDirective)
            })
          }
        })

        describe('PlantUML format', () => {
          it('should use png as default format for listing block', () => {
            const src = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], ['\'\''], '', '----'))('.imageblock.plantuml img').attr('src')
            expect(src).toBe(`${sharedSpec.LOCAL_URL}/png/${encodedDiagram}`)
          })

          it('should use png as default format for literal block', () => {
            const src = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], ['\'\''], '', '....'))('.imageblock.plantuml img').attr('src')
            expect(src).toBe(`${sharedSpec.LOCAL_URL}/png/${encodedDiagram}`)
          })

          it('should support explicit png format from positional attr', () => {
            const src = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], ['\'\'', 'png']))('.imageblock.plantuml img').attr('src')
            expect(src).toBe(`${sharedSpec.LOCAL_URL}/png/${encodedDiagram}`)
          })

          it('should support explicit svg format from positional attr', () => {
            const src = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], ['\'\'', 'svg']))('.imageblock.plantuml img').attr('src')
            expect(src).toBe(`${sharedSpec.LOCAL_URL}/svg/${encodedDiagram}`)
          })

          it('should support format from named attr', () => {
            const src = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], ['format=svg']))('.imageblock.plantuml img').attr('src')
            expect(src).toBe(`${sharedSpec.LOCAL_URL}/svg/${encodedDiagram}`)
          })

          if (fixture.hasStartEndDirectives) {
            it('should generate HTML error when unsupported format used', () => {
              const listingBlock = sharedSpec.toJQueryDOM(inputFn([`:plantuml-server-url: ${sharedSpec.LOCAL_URL}`], ['\'\'', 'qwe']))('.listingblock.plantuml-error')
              expect(listingBlock.find('img').length).toBe(0)
              expect(listingBlock.text()).toContain(startDirective)
            })
          }
        })
      })
    }
  })
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = sharedSpec
}
