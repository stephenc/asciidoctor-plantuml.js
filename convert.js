const asciidoctor = require('asciidoctor.js')();

const AsciidoctorJS_PlantUML = require('./asciidoctorjs-plantuml.js');
asciidoctor.Extensions.register(AsciidoctorJS_PlantUML);

const html = asciidoctor.convertFile('document-plantuml.adoc', 
    { to_file: false, header_footer: true });
console.log(html);
