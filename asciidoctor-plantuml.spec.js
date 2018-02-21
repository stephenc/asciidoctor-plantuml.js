const LOCAL_URL = "http://localhost:8080";

const PLANTUML_REMOTE_URL = "http://plantuml.org";

const DIAGRAM = `@startuml
alice -> bob
@enduml
`;

const asciidoctor = require('asciidoctor.js')();

const plantuml = require("./asciidoctor-plantuml.js");

describe("extension registration", function () {

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

describe("conversion to HTML", function () {

    const cheerio = require('cheerio');

    const plantumlEncoder = require('plantuml-encoder');

    let registry, encodedDiagram;

    const $$ = (doc) => cheerio.load(asciidoctor.convert(doc, {extension_registry: registry}));

    const ADOC = (url = LOCAL_URL, attrs = ["plantuml"]) => {
        let block = ["plantuml"].concat(attrs);
        return `
${url ? `:plantuml-server-url: ${url}` : ""}            
[${block.join(",")}]
----
${DIAGRAM}
----
`
    };

    beforeAll(() => {
        registry = plantuml.register(asciidoctor.Extensions.create());
        encodedDiagram = plantumlEncoder.encode(DIAGRAM);
    });

    afterEach(() => process.env.PLANTUML_SERVER_URL = "");

    describe("image tag src", function () {
        it("should point image to document attr", function () {
            const src = $$(ADOC(LOCAL_URL))("img.plantuml").attr("src");
            expect(src).toContain(LOCAL_URL);
            expect(src).toContain(encodedDiagram);
        });

        it("should override image src from env", function () {
            process.env.PLANTUML_SERVER_URL = PLANTUML_REMOTE_URL;
            const src = $$(ADOC(LOCAL_URL))("img.plantuml").attr("src");
            expect(src).toContain(PLANTUML_REMOTE_URL);
            expect(src).toContain(encodedDiagram);
        });

        it("should set image src from env", function () {
            process.env.PLANTUML_SERVER_URL = PLANTUML_REMOTE_URL;
            const src = $$(ADOC())("img.plantuml").attr("src");
            expect(src).toContain(PLANTUML_REMOTE_URL);
            expect(src).toContain(encodedDiagram);
        });
    });

    describe("image tag attributes", function () {
        it("pumlid should be populated from named attr", function () {
            const img = $$(ADOC(undefined, ["id=myId"]))("img.plantuml");
            expect(img.attr("pumlid")).toBe("myId");
        });

        it("pumlid should be populated from positional attr", function () {
            const img = $$(ADOC(undefined, ["myId"]))("img.plantuml");
            expect(img.attr("pumlid")).toBe("myId");
        });
    });

});

