var plantumlEncoder = require('plantuml-encoder')

const plantumlUrl = process.env.PLANTUML_URL; 

var createPlantumlBlock = function(parent, content, attrs) {
    
    const opts = Opal.hash({
        "content_model": "raw", "source": content, "subs" : "default" 
    }).$merge(attrs);

    return Opal.Asciidoctor.Block.$new(parent, 'pass', opts);
}

var plantumlImgContent = function(url, attrs = Opal.hash({})) {
//    console.log("attrs=", attrs);
    
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

var genUrl = function(text, format = "png") {
    var encoded = plantumlEncoder.encode(text)
    return `${plantumlUrl}/${format}/${encoded}`;
}

module.exports = function AsciidoctorJS_PlantUML () {
  this.block(function(){
    const self = this;
    
      // self.useDsl();
    self.named('plantuml');
    self.onContext('listing');
    //self.parse_content_as('simple');

    self.process(function (parent, reader, attrs) {
        const lines = reader.getLines().join("\n");
        const url = genUrl(lines);
        return createPlantumlBlock(parent, plantumlImgContent(url, attrs), attrs);
    });
  });
};

