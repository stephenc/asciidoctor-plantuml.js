const plantuml = require("./asciidoctor-plantuml.js");
const asciidoctor = require('asciidoctor.js')();

const ADOC = `
== PlantUML
:plantuml-server-url: http://plantuml.org/plantuml
[plantuml]
----
alice -> bob
bob ..> alice
----
`;

const registry = asciidoctor.Extensions.create();
plantuml.register(registry);

console.log(asciidoctor.convert(ADOC, {'extension_registry': registry}));

