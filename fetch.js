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
