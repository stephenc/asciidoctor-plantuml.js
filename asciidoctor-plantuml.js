const plantumlEncoder = require('plantuml-encoder');

function createPlantumlBlock(parent, content, attrs) {

    const opts = Opal.hash({content_model: "raw", source: content, subs: "default"}).$merge(attrs);

    return Opal.Asciidoctor.Block.$new(parent, 'pass', opts);
}

function plantumlImgContent(parent, text, attrs) {
    return `
<div class="imageblock">
<div class="content">
${createImageTag(parent, text, attrs)}
</div>
</div>`;
}

function createImageTag(parent, text, attrs) {
    const url = process.env.PLANTUML_SERVER_URL || parent.getDocument().getAttribute("plantuml-server-url");

    const encoded = plantumlEncoder.encode(text);

    let content = '<img ';
    if (parent.getDocument().isAttribute("plantuml-fetch-diagram")) {
        content += " data-fetch=true ";
    }
    content += (Opal.hash_get(attrs, "id") ? `data-pumlid="${Opal.hash_get(attrs, "id")}" ` : "");
    content += `class="plantuml" src="${url}/png/${encoded}"/>`;

    return content;
}

function plantumlBlock() {
    this.named('plantuml');
    this.onContext('listing');
    this.positionalAttributes('id');

    this.process(function (parent, reader, attrs) {
        return createPlantumlBlock(parent,
            plantumlImgContent(parent, reader.getLines().join("\n"), attrs), attrs
        );
    });
}

module.exports.register = function register(registry) {
    if (typeof registry.register === "function") {
        registry.register(function () {
            this.block(plantumlBlock);
        });
    } else if (typeof registry.block === "function") {
        registry.block("plantuml", plantumlBlock);
    }
    return registry;
};

