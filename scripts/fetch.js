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

const DIAGRAM = `@startuml
alice -> bob
@enduml
`;

const plantumlEncoder = require('plantuml-encoder');

const encodedDiagram = plantumlEncoder.encode(DIAGRAM);

const diagramUrl = `http://www.plantuml.com/plantuml/pngp/${encodedDiagram}`;

const got = require('got');

const fs = require('fs');

got.stream(diagramUrl)
    .on('error', (error, body, response) => {
        console.log(`${error} ${response}`)
    }).pipe(fs.createWriteStream('1.png'))
