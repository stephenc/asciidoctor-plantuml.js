'use strict'

module.exports = function (config) {
  config.set({
    frameworks: [ 'jasmine', 'browserify' ],

    files: [
      'dist/bundle.js',
      'spec/shared.js',
      'spec/browser.spec.js'
    ],

    reporters: [ 'dots' ],

    preprocessors: {
      'spec/browser.spec.js': [ 'browserify' ],
      'spec/shared.js': [ 'browserify' ]
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
