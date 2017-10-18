var failurePattern = /\/(dist|node_modules)(\/|$)/;

module.exports = function (f) {
  return !failurePattern.test(f);
}
