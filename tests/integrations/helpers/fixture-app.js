import path from 'node:path'
import { createStrapi } from '@strapi/strapi'

const FIXTURE_APP_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'fixtures',
  'strapi-app',
)

/**
 * Build environment variables required to boot Strapi in tests.
 *
 * @param {object} options
 * @param {string} options.databaseFilename - SQLite file path for this run.
 * @param {string} options.indexName - Dedicated Meilisearch index for this run.
 *
 * @returns {Record<string, string>} Environment overrides.
 */
function buildFixtureEnvironment({ databaseFilename, indexName }) {
  return {
    NODE_ENV: 'test',
    PORT: '0',
    STRAPI_DISABLE_CRON: 'true',
    DATABASE_FILENAME: databaseFilename,
    MEILI_TEST_INDEX_NAME: indexName,
    APP_KEYS: process.env.APP_KEYS || 'testAppKey1,testAppKey2',
    API_TOKEN_SALT: process.env.API_TOKEN_SALT || 'test-api-token-salt',
    ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || 'test-admin-jwt-secret',
    TRANSFER_TOKEN_SALT:
      process.env.TRANSFER_TOKEN_SALT || 'test-transfer-token-salt',
    ENCRYPTION_KEY:
      process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
    JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret',
  }
}

/**
 * Boot the dedicated fixture app in-process and expose it on `global.strapi`.
 *
 * @param {object} options
 * @param {string} options.databaseFilename - SQLite file path for this run.
 * @param {string} options.indexName - Dedicated Meilisearch index for this run.
 *
 * @returns {Promise<{strapi: any, restoreEnvironment: () => void}>}
 */
export async function startFixtureApp({ databaseFilename, indexName }) {
  const previousWorkingDirectory = process.cwd()
  const envOverrides = buildFixtureEnvironment({ databaseFilename, indexName })

  /** @type {Record<string, string|undefined>} */
  const previousEnvironmentValues = {}
  Object.entries(envOverrides).forEach(([name, value]) => {
    previousEnvironmentValues[name] = process.env[name]
    process.env[name] = value
  })

  process.chdir(FIXTURE_APP_PATH)

  const strapi = await createStrapi().load()
  await strapi.start()
  global.strapi = strapi

  /**
   * Restore process environment and working directory after teardown.
   */
  const restoreEnvironment = () => {
    Object.entries(previousEnvironmentValues).forEach(([name, value]) => {
      if (value === undefined) {
        delete process.env[name]
      } else {
        process.env[name] = value
      }
    })
    process.chdir(previousWorkingDirectory)
  }

  return { strapi, restoreEnvironment }
}

/**
 * Stop the fixture app and release resources.
 *
 * @param {object} options
 * @param {any} options.strapi - Running Strapi instance.
 * @param {(() => void)|undefined} options.restoreEnvironment - Cleanup callback from boot.
 *
 * @returns {Promise<void>}
 */
export async function stopFixtureApp({ strapi, restoreEnvironment }) {
  if (strapi?.server?.httpServer) {
    await strapi.server.httpServer.close()
  }
  if (strapi?.db?.connection) {
    await strapi.db.connection.destroy()
  }
  if (typeof strapi?.destroy === 'function') {
    await strapi.destroy()
  }
  global.strapi = undefined

  if (typeof restoreEnvironment === 'function') {
    restoreEnvironment()
  }
}
