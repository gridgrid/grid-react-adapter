const transformTSPaths = require('./transformTSPaths');
const jestTransforms = require('transform-ts-paths').jestTransforms;
const moduleNameMapper = Object.assign({}, transformTSPaths(
  jestTransforms.alias,
  jestTransforms.path
));

module.exports = {
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    '.(ts|tsx)': '<rootDir>/node_modules/ts-jest/preprocessor.js'
  },
  verbose: true,
  testEnvironment: 'jsdom',
  testRegex: 'src/((.+/)?__tests__/.*|.*\\.(test|spec))\\.(ts|tsx|js)$',
  testPathIgnorePatterns: ['\\.d\\.ts$'],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js'
  ],
  moduleNameMapper: moduleNameMapper,
  watchPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFiles: ['./jest-setup.ts'],
  setupTestFrameworkScriptFile: './jest-post-setup.ts',
};