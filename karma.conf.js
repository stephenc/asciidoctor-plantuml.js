'use strict';

module.exports = function(config) {
  config.set({
    frameworks: [ 'jasmine' ],

    files: [
      'dist/bundle.js',
      'node_modules/asciidoctor.js/dist/asciidoctor.js',
      'spec/browser.spec.js'
    ],

    reporters: [ 'dots' ],

    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },

    logLevel: config.LOG_DEBUG,

    singleRun: true,
    autoWatch: false,
    // force the port to use
    port: 9876
  });
};

