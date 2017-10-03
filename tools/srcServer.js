// This file configures the development web server
// which supports hot reloading and synchronized testing.

// Require Browsersync along with webpack and middleware for it
import browserSync from 'browser-sync';
// Required for react-router browserHistory
// see https://github.com/BrowserSync/browser-sync/issues/204#issuecomment-102623643
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import createConfig from '../webpack/webpack.config';
import {
  chalkSuccess
} from './chalkConfig';


import * as yargs from 'yargs';

console.log(chalkSuccess('Starting app in dev mode...'));

const branchName = process.env.npm_package_config_build_branch; // ok if this is undefined
const isOffline = !!yargs.parse(process.argv).offline;
const isDemo = process.argv[2] === 'demo';
const isStagingApi = process.argv[2] === 'staging';
const isMockData = process.argv[2] !== 'api' && !isStagingApi;
const config = createConfig(isDemo, branchName, true, isMockData, isStagingApi, isOffline);
const bundler = webpack(config);

// Run Browsersync and use middleware for Hot Module Replacement
browserSync({
  port: 7998,
  ui: {
    port: 7999
  },
  open: false,
  server: {
    baseDir: 'src',

    middleware: [

      webpackDevMiddleware(bundler, {
        // Dev middleware can't access config, so we provide publicPath
        publicPath: config.output.publicPath,

        // These settings suppress noisy webpack output so only errors are displayed to the console.
        noInfo: false,
        quiet: false,
        stats: {
          assets: false,
          colors: true,
          version: false,
          hash: false,
          timings: false,
          chunks: false,
          chunkModules: false
        },

        // for other settings see
        // http://webpack.github.io/docs/webpack-dev-middleware.html
      }),

      // bundler should be the same as above
      webpackHotMiddleware(bundler)
    ]
  },

  // no need to watch '*.js' here, webpack will take care of it for us,
  // including full page reloads if HMR won't work
  files: [
    'src/*.html'
  ]
});
