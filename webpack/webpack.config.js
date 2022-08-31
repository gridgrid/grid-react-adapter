const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');
const  path = require('path');


const transformTsConfigPaths = require('../transformTSPaths');
const globalSassRegex = /(toastr|grid)\.scss$/;
const aliases = transformTsConfigPaths();

module.exports = (opts) => {
  const isDemo = opts.isDemo;
  const branchName = opts.branchName;
  const isDev = opts.isDev || false;
  const isMockData = opts.isMockData || false;
  const isStagingApi = opts.isStagingApi || false;
  const isOffline = opts.isOffline || false;
  const isLibrary = opts.isLibrary || false;

  const useStagingUrls = !!isStagingApi || (!isDev && branchName !== 'prod');
  const isStagingOrProd = branchName === 'prod' || branchName === 'staging' || branchName ==='master' || branchName === 'main';
  const entry = [
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
    },
    libraryTarget: "umd2"
  } : {
        path: path.resolve(distPath, `${isDemo ? 'demo' : 'main'}`),
        publicPath: '/',
        filename: '[name].[chunkhash].js',
        sourceMapFilename: '[file].map'
      };

  const plugins = [

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

    new MiniCssExtractPlugin({
      filename: isDev ? 'app.css' : `[name]${!isLibrary && '.[contenthash]' || ''}.css`,
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
  ];

  const extractCSS = true;

  const module = {
    rules: [{
      test: /\.tsx?$/,
      use: [
      {
        loader: 'ts-loader',
      }
      ]
    },
    {
      test: /\.js$/,
      enforce: 'pre',
      use: ["source-map-loader"]
    },
    {
      test: /\.(eot|woff2?|ttf|otf|svg)(\?v=\d+.\d+.\d+)?$/,
      type: 'asset',
      generator: {
        filename: 'assets/fonts/[path][name][ext]',
      },
    },
    {
      test: /\.(jpe?g|png|gif|pdf|ico)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'assets/images/[name][ext]',
      },
    },
    {
      test: /\.s?css$/,
      use: [
        !extractCSS
          ? {
              loader: 'style-loader',
              options: {
                esModule: true,
                modules: {
                  namedExport: true,
                },
              },
            }
          : {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: true,
              },
            },
        {
          loader: 'css-loader',
          options: {
            esModule: true,
            modules: {
              namedExport: true,
              auto: true,
              localIdentName: isStagingOrProd ? '[hash:base64]' : '[path][name]__[local]',
            },
            sourceMap: false,
            importLoaders: 1,
          },
        },
        {
          loader: 'postcss-loader',
          options: {
            options: {
              plugins: () => [autoprefixer()],
              sourceMap: false,
            },
          },
        },
        {
          loader: 'resolve-url-loader',
          options: {
            sourceMap: false,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
          },
        },
      ],
    },
    ]
  };

  // webpack config object
  const config = {
    mode : isDev ? 'development' : 'production',
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
    };
  }
  return config;
};