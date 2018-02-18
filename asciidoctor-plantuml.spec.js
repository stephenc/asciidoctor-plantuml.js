describe("PlantUML for Asciidoctor", function () {

    const PLANTUML_LOCAL_URL = "http://localhost:8080";

    const PLANTUML_REMOTE_URL = "http://plantuml.org";

    const DOC_LOCAL_URL = `
= plantuml
:plantuml-server-url: ${PLANTUML_LOCAL_URL}

[plantuml]
----
@startuml
alice -> bob
@enduml
----
`;

    const DOC_NO_URL = `    
[plantuml]
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

        let registeredForBlock = () => Opal.send(registry, "registered_for_block?", ["plantuml", "listing"]);

        beforeAll(function () {
            registry = asciidoctor.Extensions.create();
        });

        it("should register plantuml block for listing ctx", function () {
            expect(registeredForBlock).toThrowError(/undefined method/);

            plantuml.register(registry);
            expect(registeredForBlock()).not.toBeNull();
        });
    });

    describe("conversion", function () {

        const cheerio = require('cheerio');

        let registry;

        const convertAndParse = (doc) => cheerio.load(asciidoctor.convert(doc, {extension_registry: registry}));

        beforeAll(() => registry = plantuml.register(asciidoctor.Extensions.create()));

        afterEach(() => process.env.PLANTUML_SERVER_URL = "");

        it("should point image to document attr", function () {
            expect(convertAndParse(DOC_LOCAL_URL)("img.plantuml").attr("src")).toContain(PLANTUML_LOCAL_URL);
        });

        it("should override image src from env", function () {
            process.env.PLANTUML_SERVER_URL = PLANTUML_REMOTE_URL;
            expect(convertAndParse(DOC_LOCAL_URL)("img.plantuml").attr("src")).toContain(PLANTUML_REMOTE_URL);
        });
    });

});
