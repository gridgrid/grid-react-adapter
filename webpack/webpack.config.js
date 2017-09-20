import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import WebpackMd5Hash from 'webpack-md5-hash';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import CoreJsPlugin from 'core-js-webpack-plugin';
import autoprefixer from 'autoprefixer';

import failPlugin from 'webpack-fail-plugin';
import {
  CheckerPlugin
} from 'awesome-typescript-loader';
import transformTsConfigPaths from '../transformTSPaths';
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const globalSassRegex = /(global|toastr)\.scss$/;
const aliases = transformTsConfigPaths();

export default (isDemo, branchName, isDev = false, isMockData = false, isStagingApi = false, isOffline = false) => {
  const useStagingUrls = !!isStagingApi || (!isDev && branchName !== 'prod');
  const entry = [
    'whatwg-fetch',
    'babel-polyfill',
    ...(isDev && ['./src/webpack-public-path', 'webpack-hot-middleware/client?reload=true'] || []),
    './src/index'
  ];

  const output = isDev ? {
    path: `${__dirname}/src`, // Note: Physical files are only output by the production build task `npm run build`.
    publicPath: '/',
    filename: 'bundle.js'
  } : {
    path: `./dist/${isDemo ? 'demo' : 'main'}`,
    publicPath: '/',
    filename: '[name].[chunkhash].js',
    sourceMapFilename: '[file].map'
  };

  const plugins = [
    // isDev && new BundleAnalyzerPlugin() ||  || (() => {}),

    ...(!isDev && [
      failPlugin
    ] || []),

    new CoreJsPlugin({
      modules: ['es6.promise'],
    }),

    ...(!isDev && [
      // Hash the files using MD5 so that their names change when the content changes.
      new WebpackMd5Hash(),

      // Optimize the order that items are bundled. This assures the hash is deterministic.
      new webpack.optimize.OccurenceOrderPlugin(),
    ] || []),

    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'), // Tells React to build in either dev or prod modes. https://facebook.github.io/react/downloads.html (See bottom)
      __MOCK_DATA__: !!(isDemo || isMockData),
      __DEMO__: !!isDemo,
      __DEV__: !!isDev,
      __API_BASE_URL__: useStagingUrls ?
        '"https://api.staging.creditiq.com"' :
        (
          isDev ?
          '"http://localhost:3000"' :
          '"https://api.creditiq.com"'
        ),
      __SOCKET_BASE_URL__: useStagingUrls ?
        '"https://socket.staging.creditiq.com"' :
        (
          isDev ?
          '"http://localhost:8888"' :
          '"https://socket.creditiq.com"'
        ),
      __STRIPE_KEY__: (branchName === 'prod' && !isDemo) ?
        '"pk_live_XNg1WHvwod1vdxnreJUO7o4y"' : '"pk_test_mwVRxa6S70EAv9uFNBYbNdml"',
      __MIXPANEL_TOKEN__: (branchName === 'prod' && !isDemo) ?
        '"96b1008525b5f67a1f7ccd6fbae8db70"' : '""',
      __USE_FULLSTORY__: !isDev,
      __SPLIT_API_KEY__: branchName === 'prod' ?
        '"45kigfkjph2hipkm0p92l1si72og3ooov32j"' : '"qrseg78md8q2go6gq37usd02s4cutptk07qn"',
      __SENTRY_URL__: isDev ? '""' :
        (
          branchName === 'prod' ?
          '"https://1cd04e434335429085e3ab6780e2b77a@sentry.io/148147"' :
          '"https://6f7ddaa1250d46c1bc523d538d6c2726@sentry.io/148097"'
        ),
      __NEW_RELIC_APP_ID__: isDev ? '""' :
        (branchName === 'prod' ? '"51898835"' : '"51902382"'),
      __TITLE_ENV__: isDev ?
        (`" - Dev${isOffline ? '- Offline' : ''}${isMockData ? isDemo ? ' - Demo' : '' : ` - ${isStagingApi ? 'Staging':'Local'} API`}"`) :
        (`"${isDemo ? ' - Demo' : ''}${branchName !== 'prod' ? ` - ${branchName}` : ''}"`),
      __OFFLINE_MODE__: !!(isDev && isOffline)
    }),

    ...(isDev && [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin(),
    ] || []),

    new CheckerPlugin(),
    new ExtractTextPlugin(isDev ? 'app.css' : '[name].[contenthash].css', {
      allChunks: true
    }),
    new HtmlWebpackPlugin({ // Create HTML file that includes references to bundled CSS and JS.
      template: '!!ejs-compiled-loader!src/index.ejs',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: !isDev,
        useShortDoctype: !isDev,
        removeEmptyAttributes: !isDev,
        removeStyleLinkTypeAttributes: !isDev,
        keepClosingSlash: !isDev,
        minifyJS: !isDev,
        minifyCSS: !isDev,
        minifyURLs: !isDev
      },
      inject: true
    }),
    ...(!isDev && [

      // Eliminate duplicate packages when generating bundle
      new webpack.optimize.DedupePlugin(),

      // Minify JS
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: true
      })
    ] || [])
  ];

  const module = {
    preLoaders: [{
      test: /\.js$/,
      loader: "source-map-loader"
    }],
    loaders: [{
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader'
      }, {
        test: /\.js$/,
        exclude: /node_modules\/(?!(@creditiq\/?|download\-in\-browser)).*/,
        loaders: ['babel']
      },
      {
        test: /\.eot(\?v=\d+.\d+.\d+)?$/,
        loader: 'url?name=assets/fonts/[name].[ext]'
      }, {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "url?limit=10000&mimetype=application/font-woff&name=assets/fonts/[name].[ext]"
      }, {
        test: /\.ttf(\?v=\d+.\d+.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/octet-stream&name=assets/fonts/[name].[ext]'
      }, {
        test: /\.svg(\?v=\d+.\d+.\d+)?$/,
        loader: 'url?limit=10000&mimetype=image/svg+xml&name=assets/fonts/[name].[ext]'
      }, {
        test: /\.(jpe?g|png|gif|pdf)$/i,
        loader: 'file?name=assets/images/[name].[ext]'
      }, {
        test: /\.ico$/,
        loader: 'file?name=assets/icons/[name].[ext]'
      },
      {
        test: (absPath) => /\.scss$/.test(absPath) && !globalSassRegex.test(absPath),
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap&modules&importLoaders=1&localI‌​dentName=[name]__[local]___[hash:base64:5]!postcss!sass?sourceMap')
      }, {
        test: globalSassRegex,
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap&importLoaders=1&localI‌​dentName=[name]__[local]___[hash:base64:5]!postcss!sass?sourceMap')
      }, {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap&importLoaders=1&localI‌​dentName=[name]__[local]___[hash:base64:5]!postcss?sourceMap')
      }
    ]
  };

  // webpack config object
  const config = {
    resolve: {
      extensions: ['', '.js', '.ts', '.tsx'],
      alias: aliases
    },
    debug: true,
    devtool: 'source-map', // more info:https://webpack.github.io/docs/build-performance.html#sourcemaps and https://webpack.github.io/docs/configuration.html#devtool
    noInfo: true, // set to false to see a list of every file being bundled.
    entry,
    target: 'web', // necessary per https://webpack.github.io/docs/testing.html#compile-and-test
    output,
    plugins,
    module,
    postcss: () => [autoprefixer]
  };
  return config;
};
