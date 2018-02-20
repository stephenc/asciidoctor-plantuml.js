const plantuml = require("./asciidoctor-plantuml.js");
const asciidoctor = require('asciidoctor.js')();


const ADOC = `
== PlantUML example
:plantuml-server-url: http://plantuml.org/plantuml
[plantuml]
----
alice -> bob
bob ..> alice
----
`;


const registry = plantuml.register(asciidoctor.Extensions.create());
console.log(asciidoctor.convert(ADOC, {extension_registry: registry}));

