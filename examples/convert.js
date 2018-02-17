const asciidoctor = require('asciidoctor.js')();

const registryA = asciidoctor.Extensions.create();

const ext = require('../asciidoctor-plantuml.js');

ext.register(registryA);

const html = asciidoctor.convertFile('document-plantuml.adoc', { 
    to_file: false,
    extension_registry: registryA
});

console.log(html);
