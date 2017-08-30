const config = require('./jest.config');
config.testRegex = config.testRegex.replace('src', 'dist');
module.exports = config;
