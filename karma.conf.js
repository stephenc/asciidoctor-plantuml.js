'use strict'

module.exports = function (config) {
  config.set({
    frameworks: [ 'jasmine', 'browserify' ],

    files: [
      'dist/browser/asciidoctor-plantuml.js',
      'test/shared.js',
      'test/browser.spec.js'
    ],

    reporters: [ 'dots' ],

    preprocessors: {
      'test/browser.spec.js': ['browserify'],
      'test/shared.js': ['browserify']
    },

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
    port: 9876,

    // browserify configuration
    browserify: {
      debug: true,
      transform: [ ]
    }
  })
}
