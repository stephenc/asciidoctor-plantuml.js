const plantumlEncoder = require('plantuml-encoder');

function createPlantumlBlock(parent, content, attrs) {

    const opts = Opal.hash({content_model: "raw", source: content, subs: "default"}).$merge(attrs);

    return Opal.Asciidoctor.Block.$new(parent, 'pass', opts);
}

function plantumlImgContent(url, attrs = Opal.hash({})) {

    let content = "<!-- plantuml begin -->\n";
    content += '<div class="imageblock">';
    content += '<div class="content">';
    content += '<img ';
    if (attrs.$fetch('id', undefined)) content += `id="${attrs.$fetch('id')}" `;
    content += `class="plantuml" src="${url}" `;
    content += '/>';
    content += '</div>';
    content += '</div>';
    content += "\n<!-- plantuml end -->\n";

    return content;
}

function genUrl(parent, text) {
    const url = parent.getDocument().getAttribute("plantuml-server-url");
    const encoded = plantumlEncoder.encode(text);
    return `${url}/png/${encoded}`;
}

function plantumlBlock() {
    this.named('plantuml');
    this.onContext('listing');

    this.process(function (parent, reader, attrs) {
        const lines = reader.getLines().join("\n");
        const url = genUrl(parent, lines);
        return createPlantumlBlock(parent, plantumlImgContent(url, attrs), attrs);
    });
}

module.exports.register = function register(registry) {
    registry.block("plantuml", plantumlBlock);
    registry.treeProcessor(function () {
        var self = this;
        self.process(function (doc) {
            if (process.env.PLANTUML_SERVER_URL) {
                doc.removeAttribute("plantuml-server-url");
                doc.setAttribute("plantuml-server-url", process.env.PLANTUML_SERVER_URL);
            }
            return doc;
        });
    });
    return registry;
};

