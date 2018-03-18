const asciidoctor = require('asciidoctor.js')();
const plantuml = require('../asciidoctor-plantuml.js');

const ADOC = `
== PlantUML
:plantuml-server-url: http://www.plantuml.com/plantuml
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
// eslint-disable-next-line no-console
console.log(asciidoctor.convert(ADOC));
