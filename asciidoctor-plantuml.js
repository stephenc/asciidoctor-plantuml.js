var plantumlEncoder = require('plantuml-encoder')

const PLANTUML_URL = process.env.PLANTUML_URL; 

function createPlantumlBlock(parent, content, attrs) {
    
    const opts = Opal.hash({
        "content_model": "raw", "source": content, "subs" : "default" 
    }).$merge(attrs);

    return Opal.Asciidoctor.Block.$new(parent, 'pass', opts);
}

function plantumlImgContent(url, attrs = Opal.hash({})) {
    
    var content = "<!-- plantuml begin -->\n";
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

function genUrl(text, format = "png") {
    var encoded = plantumlEncoder.encode(text)
    return `${PLANTUML_URL}/${format}/${encoded}`;
}

function plantumlBlock() {
    this.named('plantuml');
    this.onContext('listing');

    this.process(function (parent, reader, attrs) {
        const lines = reader.getLines().join("\n");
        const url = genUrl(lines);
        return createPlantumlBlock(parent, plantumlImgContent(url, attrs), attrs);
    });
}

module.exports.register = function register (registry) {
  registry.block("plantuml", plantumlBlock);
}

