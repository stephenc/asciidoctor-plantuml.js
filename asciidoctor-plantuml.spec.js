describe("Asciidoctor PlantUML", function () {

    const PLANTUML_LOCAL_URL = "http://localhost:8080";

    const DOC_LOCAL_URL = `
= plantuml
:plantuml-server-url: ${PLANTUML_LOCAL_URL}

[plantuml,id=myId]
----
@startuml
alice -> bob
@enduml
----
`;

    const DOC_NO_URL = `    
[plantuml,id=myId]
----
@startuml
alice -> bob
@enduml
----
`;

    const asciidoctor = require('asciidoctor.js')();

    const plantuml = require("./asciidoctor-plantuml.js");

    describe("registration", function () {

        let registry;

        let registeredForBlock = function () {
            return Opal.send(registry, "registered_for_block?", ["plantuml", "listing"]);
        };

        beforeAll(function () {
            registry = asciidoctor.Extensions.create();
        });

        it("should register plantuml block for listing ctx", function () {
            expect(registeredForBlock).toThrowError(/nil/);

            plantuml.register(registry);
            expect(registeredForBlock()).not.toBe(null);
        });
    });

    describe("conversion", function () {

        const cheerio = require('cheerio');

        let registry;

        const convertAndParse = (doc) => cheerio.load(asciidoctor.convert(doc, {extension_registry: registry}));

        beforeAll(function () {
            registry = asciidoctor.Extensions.create();
            plantuml.register(registry);
        });

        afterEach(() => process.env.PLANTUML_SERVER_URL = "");

        it("should point image to document attr", function () {
            const $ = convertAndParse(DOC_LOCAL_URL);
            expect($("img#myId").attr("src")).toContain(PLANTUML_LOCAL_URL);
        });

        it("should override image src from env var", function () {
            process.env.PLANTUML_SERVER_URL = "http://planuml.org";
            const $ = convertAndParse(DOC_LOCAL_URL);
            expect($("img#myId").attr("src")).toContain(process.env.PLANTUML_SERVER_URL);
        });
    });

});
