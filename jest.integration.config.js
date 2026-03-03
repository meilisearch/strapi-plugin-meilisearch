/*
 * Jest configuration for integration tests.
 *
 * This config is separate from the main jest.config.js to ensure:
 * - No mocking of the meilisearch package (we need the real client)
 * - Higher timeouts for polling/waiting on external services
 * - Separate test environment and coverage settings
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/integration-tests/**/*.test.js'],
  collectCoverage: false,
  testTimeout: 120000, // 120s for polling Meilisearch + waiting for indexing
  clearMocks: true,
}
