describe("PlantUML for Asciidoctor", function () {

    const LOCAL_URL = "http://localhost:8080";

    const PLANTUML_REMOTE_URL = "http://plantuml.org";

    const PLANT_UML = `----
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

        const $$ = (doc) => cheerio.load(asciidoctor.convert(doc, {extension_registry: registry}));

        const ADOC = (url = LOCAL_URL, attrs = ["plantuml"]) => {
            let block = ["plantuml"].concat(attrs);
            return `
${url ? `:plantuml-server-url: ${url}` : ""}            
[${block.join(",")}]
${PLANT_UML}
`
        };

        beforeAll(() => registry = plantuml.register(asciidoctor.Extensions.create()));

        afterEach(() => process.env.PLANTUML_SERVER_URL = "");

        it("should point image to document attr", function () {
            expect($$(ADOC(LOCAL_URL))("img.plantuml").attr("src")).toContain(LOCAL_URL);
        });

        it("should override image src from env", function () {
            process.env.PLANTUML_SERVER_URL = PLANTUML_REMOTE_URL;
            expect($$(ADOC(LOCAL_URL))("img.plantuml").attr("src")).toContain(PLANTUML_REMOTE_URL);
        });

        it("should set image src from env", function () {
            process.env.PLANTUML_SERVER_URL = PLANTUML_REMOTE_URL;
            expect($$(ADOC())("img.plantuml").attr("src")).toContain(PLANTUML_REMOTE_URL);
        });

        it("should support named id attribute", function () {
            expect($$(ADOC(undefined, ["id=myId"]))("img.plantuml#myId").length).toEqual(1);
        });

    });

});
