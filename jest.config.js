/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  clearMocks: true,
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  // collectCoverageFrom: undefined,

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ['/node_modules/', '__tests__'],

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: undefined,

  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
}
