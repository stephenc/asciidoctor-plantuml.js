const plantumlEncoder = require('plantuml-encoder');

function createPlantumlBlock(parent, content, attrs) {

    const opts = Opal.hash({content_model: "raw", source: content, subs: "default"}).$merge(attrs);

    return Opal.Asciidoctor.Block.$new(parent, 'pass', opts);
}

function plantumlImgContent(parent, url, attrs) {

    let content = '<div class="imageblock">';
    content += '<div class="content">';
    content += '<img ';

    if (parent.getDocument().isAttribute("plantuml-fetch-diagram")) {
        content += " fetch=true ";
    }
    content += (Opal.hash_get(attrs, "id") ? `pumlid="${Opal.hash_get(attrs, "id")}" ` : "");
    content += `class="plantuml" src="${url}"/>`;
    content += '</div>';
    content += '</div>';

    return content;
}

function genUrl(parent, text) {
    const url = process.env.PLANTUML_SERVER_URL || parent.getDocument().getAttribute("plantuml-server-url");
    const encoded = plantumlEncoder.encode(text);
    return `${url}/png/${encoded}`;
}

function plantumlBlock() {
    this.named('plantuml');
    this.onContext('listing');
    this.positionalAttributes('id');

    this.process(function (parent, reader, attrs) {
        const lines = reader.getLines().join("\n");
        const url = genUrl(parent, lines);
        return createPlantumlBlock(parent, plantumlImgContent(parent, url, attrs), attrs);
    });
}

module.exports.register = function register(registry) {
    if (typeof registry.register === "function") {
        registry.register(function() {
            this.block(plantumlBlock);
        });
    } else if (typeof registry.block === "function") {
        registry.block("plantuml", plantumlBlock);
    }
    return registry;
};

