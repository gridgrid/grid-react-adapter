// This file configures a web server for testing the production build
// on your local machine.

const browserSync = requrie('browser-sync');
const historyApiFallback = requrie('connect-history-api-fallback');
const { chalkProcessing } = requrie('./chalkConfig');

const isDemo = process.argv[2] === 'demo';

/* eslint-disable no-console */

console.log(chalkProcessing('Opening production build...'));

// Run Browsersync
browserSync({
  port: 8000,
  ui: {
    port: 8001
  },
  server: {
    baseDir: `dist/${isDemo ? 'demo' : 'main'}`
  },

  files: [
    'src/*.html'
  ],

  middleware: [historyApiFallback()]
});
