import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import WebpackMd5Hash from 'webpack-md5-hash';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import autoprefixer from 'autoprefixer';
import * as path from 'path';


import failPlugin from 'webpack-fail-plugin';
import {
  CheckerPlugin
} from 'awesome-typescript-loader';

import externals from './externals';
import transformTsConfigPaths from '../transformTSPaths';
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const globalSassRegex = /(toastr|grid)\.scss$/;
const aliases = transformTsConfigPaths();

export default (opts) => {
  const isDemo = opts.isDemo;
  const branchName = opts.branchName;
  const isDev = opts.isDev || false;
  const isMockData = opts.isMockData || false;
  const isStagingApi = opts.isStagingApi || false;
  const isOffline = opts.isOffline || false;
  const isLibrary = opts.isLibrary || false;

  const useStagingUrls = !!isStagingApi || (!isDev && branchName !== 'prod');
  const entry = [
    'whatwg-fetch',
    ...(isDev && ['./src/app/webpack-public-path', 'webpack-hot-middleware/client?reload=true'] || []),
    isLibrary ? './src/lib/index' : './src/app/index'
  ];
  const distPath = path.resolve(__dirname, `../dist/`);

  const output = isDev ? {
    path: `${__dirname}/src`, // Note: Physical files are only output by the production build task `npm run build`.
    publicPath: '/',
    filename: 'bundle.js'
  } : isLibrary ? {
    path: distPath,
    publicPath: '/',
    filename: '[name].js',
    sourceMapFilename: '[file].map',
    library: {
      root: "GridReactAdapter",
      amd: "grid-react-adapter",
      commonjs: "grid-react-adapter",
      commonjs2: "grid-react-adapter"
    },
    libraryTarget: "umd2"
  } : {
        path: path.resolve(distPath, `${isDemo ? 'demo' : 'main'}`),
        publicPath: '/',
        filename: '[name].[chunkhash].js',
        sourceMapFilename: '[file].map'
      };

  const plugins = [
    // isDev && new BundleAnalyzerPlugin() ||  || (() => {}),

    ...(!isDev && [
      failPlugin
    ] || []),

    ...(!isDev && !isLibrary && [
      // Hash the files using MD5 so that their names change when the content changes.
      new WebpackMd5Hash(),

    ] || []),

    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'production' : 'production'), // Tells React to build in either dev or prod modes. https://facebook.github.io/react/downloads.html (See bottom)
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
        (`" - Dev${isOffline ? '- Offline' : ''}${isMockData ? isDemo ? ' - Demo' : '' : ` - ${isStagingApi ? 'Staging' : 'Local'} API`}"`) :
        (`"${isDemo ? ' - Demo' : ''}${branchName !== 'prod' ? ` - ${branchName}` : ''}"`),
      __OFFLINE_MODE__: !!(isDev && isOffline)
    }),

    ...(isDev && [
      new webpack.HotModuleReplacementPlugin(),
      // new webpack.NoErrorsPlugin(),
    ] || []),

    new CheckerPlugin(),
    new ExtractTextPlugin({
      filename: isDev ? 'app.css' : `[name]${!isLibrary && '.[contenthash]' || ''}.css`,
      allChunks: true
    }),
    new HtmlWebpackPlugin({ // Create HTML file that includes references to bundled CSS and JS.
      template: '!!ejs-compiled-loader!src/app/index.ejs',
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

      // Minify JS
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: true
      })
    ] || []),
  ];

  const extractTextOptionsNonGlobal = {
    fallback: 'style-loader',
    use: [{
      loader: 'typings-for-css-modules-loader',
      options: {
        namedExport: true,
        camelCase: true,
        sourceMap: true,
        modules: true,
        importLoaders: 1,
        localIdentName: '[name]__[local]___[hash:base64:5]'
      }
    },
    {
      loader: 'postcss-loader',
      options: {
        plugins: (loader) => [
          autoprefixer(),
        ],
        sourceMap: true
      }
    },
      'resolve-url-loader?sourceMap',
      'sass-loader?sourceMap'
    ]
  };

  // yaya it's dirty but it's also DRY. DRY and dirty suckas.
  const extractTextOptionsGlobal = JSON.parse(JSON.stringify(extractTextOptionsNonGlobal));
  const extractTextOptionsCss = JSON.parse(JSON.stringify(extractTextOptionsNonGlobal));
  extractTextOptionsCss.use[0] = extractTextOptionsGlobal.use[0] = {
    loader: 'css-loader',
    options: {
      modules: false,
      sourceMap: true,
      importLoaders: 1,
      localIdentName: '[name]__[local]___[hash:base64:5]'
    }
  };
  extractTextOptionsCss.use.splice(extractTextOptionsCss.use.indexOf('sass-loader'), 1);

  const module = {
    rules: [{
      test: /\.tsx?$/,
      use: [{
        loader: 'babel-loader',
        options: {
          "plugins": ["transform-runtime"]
        }
      },
      {
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            outDir: './'
          }
        }
      }
      ]
    },
    {
      test: /\.js$/,
      enforce: 'pre',
      use: ["source-map-loader"]
    },
    {
      test: /\.js$/,
      exclude: /node_modules\/(?!(@creditiq\/?|download\-in\-browser)).*/,
      use: ['babel-loader']
    },
    {
      test: /\.eot(\?v=\d+.\d+.\d+)?$/,
      use: {
        loader: 'url-loader',
        options: {
          'name': 'assets/fonts/[name].[ext]'
        }
      }
    },
    {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/font-woff',
          name: 'assets/fonts/[name].[ext]'
        }
      }]
    },
    {
      test: /\.ttf(\?v=\d+.\d+.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/octet-stream',
          name: 'assets/fonts/[name].[ext]'
        }
      }]
    },
    {
      test: /\.svg(\?v=\d+.\d+.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'image/svg+xml',
          name: 'assets/fonts/[name].[ext]'
        }
      }],
    },
    {
      test: /\.(jpe?g|png|gif|pdf)$/i,
      use: [{
        loader: 'file-loader',
        options: {
          name: 'assets/images/[name].[ext]'
        }
      }]
    },
    {
      test: /\.ico$/,
      use: [{
        loader: 'file-loader',
        options: {
          name: 'assets/icons/[name].[ext]'
        }
      }]
    },
    {
      test: (absPath) => /\.scss$/.test(absPath) && !globalSassRegex.test(absPath),
      use: ExtractTextPlugin.extract(extractTextOptionsNonGlobal)
    },
    {
      test: globalSassRegex,
      use: ExtractTextPlugin.extract(extractTextOptionsGlobal)
    },
    {
      test: /\.css$/,
      use: ExtractTextPlugin.extract(extractTextOptionsCss)
    }
    ]
  };

  // webpack config object
  const config = {
    resolve: {
      extensions: ['.js', '.ts', '.tsx'],
      alias: aliases
    },
    devtool: 'source-map', // more info:https://webpack.github.io/docs/build-performance.html#sourcemaps and https://webpack.github.io/docs/configuration.html#devtool
    entry,
    target: 'web', // necessary per https://webpack.github.io/docs/testing.html#compile-and-test
    output,
    plugins,
    module,
  };
  if (!isDev) {
    config.externals = {
      ...(isLibrary && {
        'react': {
          root: 'React',
          commonjs2: 'react',
          commonjs: 'react',
          amd: 'react'
        },
        'react-dom': {
          root: 'ReactDOM',
          commonjs2: 'react-dom',
          commonjs: 'react-dom',
          amd: 'react-dom',
        },
        'global.scss': 'commonjs global.scss',
        '_variables.scss': 'commonjs _variables.scss',
        '_mixins.scss': 'commonjs _mixins.scss',
        'grid': 'commonjs grid',
      }),
      ...externals
    };
  }
  return config;
};