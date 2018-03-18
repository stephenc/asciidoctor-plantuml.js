/* global Opal */
const plantumlEncoder = require('plantuml-encoder');
const request = require('sync-request');
const fs = require('fs');
const randomstring = require('randomstring');
const path = require('path');
const mkdirp = require('mkdirp');

function createPlantumlBlock (parent, content, attrs) {
  const opts = Opal.hash({content_model: 'raw', source: content, subs: 'default'}).$merge(attrs);
  return Opal.Asciidoctor.Block.$new(parent, 'pass', opts);
}

function plantumlNoServerURLContent () {
  return `<div class="listingblock">
<div class="content">
<pre class="plantuml plantuml-error">PlantUML Server URL is not defined neither via :plantuml-server-url: nor via PLANTUML_SERVER_URL environment variable</pre>
</div>
</div>
`;
}

function createImageTag (serverUrl, shouldFetch, outdir, text, blockId) {
  let diagramUrl = `${serverUrl}/png/${plantumlEncoder.encode(text)}`;
  if (shouldFetch) {
    mkdirp.sync(outdir || '');
    const diagramName = `${randomstring.generate()}.png`;
    const diagramPath = path.format({dir: outdir || '', base: diagramName});

    fs.writeFileSync(diagramPath, request('GET', diagramUrl).getBody());
    diagramUrl = diagramName;
  }
  let content = '<img ';
  content += (blockId ? `data-pumlid="${blockId}" ` : '');
  content += `class="plantuml" src="${diagramUrl}"/>`;
  return content;
}

function plantumlBlock () {
  this.named('plantuml');
  this.onContext('listing');
  this.positionalAttributes('id');

  this.process(function (parent, reader, attrs) {
    const serverUrl = process.env.PLANTUML_SERVER_URL || parent.getDocument().getAttribute('plantuml-server-url');
    let content;
    if (serverUrl) {
      const shouldFetch = parent.getDocument().isAttribute('plantuml-fetch-diagram');
      content = `
<div class="imageblock">
<div class="content">
${createImageTag(serverUrl, shouldFetch, 
    parent.getDocument().getAttribute('imagesoutdir'), 
    reader.getLines().join('\n'), 
    Opal.hash_get(attrs, 'id'))}
</div>
</div>`;
    } else {
      content = plantumlNoServerURLContent();
    }
    return createPlantumlBlock(parent, content, attrs);
  });
}

module.exports.register = function register (registry) {
  if (typeof registry.register === 'function') {
    registry.register(function () {
      this.block(plantumlBlock);
    });
  } else if (typeof registry.block === 'function') {
    registry.block('plantuml', plantumlBlock);
  }
  return registry;
};

