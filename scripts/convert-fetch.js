/*

Image Output Location

When Asciidoctor Diagram writes images to disk it will go over the following options in order to determine where to write the files.

{imagesoutdir} if the imagesoutdir attribute has been specified

{outdir}/{imagesdir} if the outdir attribute has been specified

{to_dir}/{imagesdir} if the to_dir attribute has been specified

{base_dir}/{imagesdir}

        def image_output_dir(parent)
          document = parent.document

          images_dir = parent.attr('imagesoutdir')

          if images_dir
            base_dir = nil
          else
            base_dir = parent.attr('outdir') || (document.respond_to?(:options) && document.options[:to_dir])
            images_dir = parent.attr('imagesdir')
          end

          parent.normalize_system_path(images_dir, base_dir)
        end

    */

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

[plantuml]
----
1 -> 2
2 ..> 1
----
`;


//const registry = asciidoctor.Extensions.create();
//plantuml.register(registry);
//console.log(asciidoctor.convert(ADOC, {'extension_registry': registry}));
//console.log("===========================");
plantuml.register(asciidoctor.Extensions);
console.log(asciidoctor.convert(ADOC));
