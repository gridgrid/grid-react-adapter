// More info on Webpack's Node API here: https://webpack.github.io/docs/node.js-api.html
// Allowing console calls below since this is a build file.
/* eslint-disable no-console */
const webpack = require('webpack');
const createConfig = require('../webpack/webpack.config');
const {
  chalkProcessing
} = require('./chalkConfig.js');
const yargs = require('yargs');

const {
  doneCallback
} = require('./buildCallback');

const isWatchMode = !!yargs.parse(process.argv).watch;
const branchName = process.env.npm_package_config_build_branch; // ok if this is undefined
process.env.NODE_ENV = 'production'; // this assures React is built in prod mode and that the Babel dev config doesn't apply.


console.log(chalkProcessing('Generating minified bundle for production via Webpack. This will take a moment...'));

const webpackInstance = webpack(
  createConfig({
    demo: false,
    branchName,
    isLibrary: true
  })
);

if (isWatchMode) {
  webpackInstance.watch(undefined, doneCallback);
} else {
  webpackInstance.run(doneCallback);
}
