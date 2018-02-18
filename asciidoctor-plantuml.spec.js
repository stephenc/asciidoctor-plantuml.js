describe("Asciidoctor PlantUML", function () {
    const DOCUMENT = `
[plantuml]
----
@startuml
alice -> bob
@enduml
----
`;

    const asciidoctor = require('asciidoctor.js')();

    const plantuml = require("./asciidoctor-plantuml.js");

    describe("register()", function () {

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

    describe("PlantUML server URL attribute", function () {

        afterEach(() => process.env.PLANTUML_SERVER_URL = "");

        it("should not re-set attribute if not declared", function () {
            let registry = plantuml.register(asciidoctor.Extensions.create());
            const doc = asciidoctor.load("== Header2", {extension_registry: registry});
            expect(doc.getAttribute("plantuml-server-url")).toBe(undefined);
        });

        it("should keep server url attribute when passed", function () {
            let registry = plantuml.register(asciidoctor.Extensions.create());
            const doc = asciidoctor.load("== Header2", {
                attributes: "plantuml-server-url=http://plantuml.org",
                extension_registry: registry
            });
            expect(doc.getAttribute("plantuml-server-url")).toBe("http://plantuml.org");
        });

        it("should override server url from ENV var", function () {
            process.env.PLANTUML_SERVER_URL = "http://localhost:8080";
            let registry = plantuml.register(asciidoctor.Extensions.create());
            const doc = asciidoctor.load("== Header2", {
                attributes: "plantuml-server-url=http://plantuml.org",
                extension_registry: registry
            });
            expect(doc.getAttribute("plantuml-server-url")).toBe("http://localhost:8080");
        });
    });

});
