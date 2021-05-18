const transformTSPaths = require('./transformTSPaths');
const jestTransforms = require('transform-ts-paths').jestTransforms;
const moduleNameMapper = Object.assign({}, transformTSPaths(
  jestTransforms.alias,
  jestTransforms.path
));

module.exports = {
  transform: {
    '.(ts|tsx)': 'ts-jest'
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
  setupFilesAfterEnv: ['./jest-post-setup.ts'],
};