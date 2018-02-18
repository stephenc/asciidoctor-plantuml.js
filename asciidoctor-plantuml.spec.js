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
});
