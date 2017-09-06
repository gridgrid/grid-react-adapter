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
  testEnvironment: 'node',
  testRegex: 'src/((.+/)?__tests__/.*|.*\\.(test|spec))\\.(ts|tsx|js)$',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js'
  ],
  moduleNameMapper: moduleNameMapper,
  watchPathIgnorePatterns: ['dist']
};
