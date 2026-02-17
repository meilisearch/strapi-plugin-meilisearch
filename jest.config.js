/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  clearMocks: true,
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  // collectCoverageFrom: undefined,

  // An array of regexp pattern strings used to skip coverage
  coveragePathIgnorePatterns: ['/node_modules/', '__tests__'],

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: undefined,

  // TODO: remove comment at the end of plugin migration
  // testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  testMatch: [
    '**/__tests__/**/content-types.test.[jt]s?(x)',
    '**/__tests__/**/meilisearch.test.[jt]s?(x)',
    '**/__tests__/**/configuration.test.[jt]s?(x)',
    '**/__tests__/**/lifecycle.test.[jt]s?(x)',
    '**/__tests__/**/configuration-validation.test.[jt]s?(x)',
    '**/__tests__/**/document-middleware.test.[jt]s?(x)',
  ],
}
