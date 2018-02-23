const LOCAL_URL = "http://localhost:8080";

const PLANTUML_REMOTE_URL = "http://www.plantuml.com/plantuml";

const DIAGRAM = `@startuml
alice -> bob
@enduml
`;

const plantuml = require("./asciidoctor-plantuml.js");

const asciidoctor = require('asciidoctor.js')();

const fs = require('fs');

const tmp = require('tmp');
tmp.setGracefulCleanup();

const path = require('path');

describe("extension registration", function () {

    let registry;

    let registeredForBlock = () => Opal.send(registry, "registered_for_block?", ["plantuml", "listing"]);

    beforeAll(() => registry = asciidoctor.Extensions.create());

    it("should register plantuml block for listing ctx", () => {
        expect(registeredForBlock).toThrowError(/undefined method/);

        plantuml.register(registry);
        expect(registeredForBlock()).not.toBeNull();
    });
});

describe("conversion to HTML", () => {

    const cheerio = require('cheerio');

    const plantumlEncoder = require('plantuml-encoder');

    const $$ = (doc) => cheerio.load(asciidoctor.convert(doc, {extension_registry: registry}));

    const ADOC = (docAttrs = [], blockAttrs = []) => {
        return `            
${docAttrs.join("\n")}        
[${(blockAttrs ? ["plantuml"].concat(blockAttrs) : ["plantuml"]).join(",")}]
----
${DIAGRAM}
----
`
    };

    let registry, encodedDiagram;

    beforeAll(() => {
        registry = plantuml.register(asciidoctor.Extensions.create());
        encodedDiagram = plantumlEncoder.encode(DIAGRAM);
    });

    afterEach(() => process.env.PLANTUML_SERVER_URL = "");

    it("should create div.imageblock with img inside", () => {
        const root = $$(ADOC([`:plantuml-server-url: ${LOCAL_URL}`]))("div.imageblock");
        expect(root.find("div.content img.plantuml").length).toBe(1);
    });

    it("when :plantuml-server-url: diagram src uses it", () => {
        const src = $$(ADOC([`:plantuml-server-url: ${LOCAL_URL}`]))("img.plantuml").attr("src");
        expect(src).toBe(`${LOCAL_URL}/png/${encodedDiagram}`);
    });

    it("when :plantuml-server-url: missing diagram src taken from ENV", () => {
        process.env.PLANTUML_SERVER_URL = PLANTUML_REMOTE_URL;
        const src = $$(ADOC())("img.plantuml").attr("src");
        expect(src).toBe(`${PLANTUML_REMOTE_URL}/png/${encodedDiagram}`);
    });

    it("ENV var should override :plantuml-server-url: in diagram src", () => {
        process.env.PLANTUML_SERVER_URL = PLANTUML_REMOTE_URL;
        const src = $$(ADOC([`:plantuml-server-url: ${LOCAL_URL}`]))("img.plantuml").attr("src");
        expect(src).toBe(`${PLANTUML_REMOTE_URL}/png/${encodedDiagram}`);
    });

    describe("image fetching", () => {
        let src = undefined;

        afterEach(() => {
            try {
                fs.unlinkSync(src)
            } catch (e) {
            }
        });

        it("should fetch when download attribute set", () => {
            const html = $$(ADOC([`:plantuml-server-url: ${PLANTUML_REMOTE_URL}`, ":plantuml-fetch-diagram:"]));

            src = html("img.plantuml").attr("src");

            expect(src).toContain(".png");
            expect(fs.existsSync(src)).toBe(true);

            expect(fs.statSync(src).size).toBe(1784);
        });

        it("should support imagesoutdir for storing images", () => {
            const tmpDir = tmp.dirSync({prefix: 'adoc_puml_'});

            const html = $$(ADOC([`:plantuml-server-url: ${PLANTUML_REMOTE_URL}`,
                ":plantuml-fetch-diagram:",
                `:imagesoutdir: ${tmpDir.name}`
            ]));

            src = html("img.plantuml").attr("src");

            expect(src).toStartWith(tmpDir.name);
            expect(fs.existsSync(src)).toBe(true);

            expect(fs.statSync(src).size).toBe(1784);
        });
    });

    describe("image tag attributes", () => {
        it("pumlid from named attr", () => {
            const img = $$(ADOC([], ["id=myId"]))("img.plantuml");
            expect(img.data("pumlid")).toBe("myId");
        });

        it("pumlid from positional attr", () => {
            const img = $$(ADOC([], ["myId"]))("img.plantuml");
            expect(img.data("pumlid")).toBe("myId");
        });
    });

});

