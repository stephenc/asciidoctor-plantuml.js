/* eslint-env jasmine */
/* global Asciidoctor, AsciidoctorPlantuml */
const DIAGRAM = `@startuml
alice -> bob
@enduml
`

const asciidoctor = Asciidoctor()

describe('conversion to HTML', () => {
  it('should work', () => {
    const content = `
:plantuml-server-url: http://www.plantuml.com/plantuml

[plantuml]
----
${DIAGRAM}
----
`
    const registry = asciidoctor.Extensions.create()
    AsciidoctorPlantuml.register(registry)
    const html = asciidoctor.convert(content, {extension_registry: registry})
    const div = document.createElement('div')
    div.innerHTML = html
    expect(Array.from(div.getElementsByClassName('plantuml')).length, 1)
    expect(Array.from(div.getElementsByClassName('plantuml'))[0].getAttribute('src'), 'http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhCoKnELT2rKqZAJ-9oICrB0Ga20000')
  })
})
