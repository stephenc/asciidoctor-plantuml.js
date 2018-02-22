const asciidoctor = require('asciidoctor.js')();
const plantuml = require("../asciidoctor-plantuml.js");

const ADOC = `
== PlantUML
:plantuml-server-url: http://www.plantuml.com/plantuml
:plantuml-fetch-diagram:
[plantuml]
----
alice -> bob
bob ..> alice
----

//[plantuml]
//----
//1 -> 2
//2 ..> 1
//----
`;


//const registry = asciidoctor.Extensions.create();
//plantuml.register(registry);
//console.log(asciidoctor.convert(ADOC, {'extension_registry': registry}));
//console.log("===========================");
plantuml.register(asciidoctor.Extensions);
console.log(asciidoctor.convert(ADOC));
