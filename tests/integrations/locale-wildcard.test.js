// Ensure integration tests use the real client, not Jest manual mocks.
jest.unmock('meilisearch')

import {
  localizedRestaurantDocuments,
  restaurantDocuments,
} from './helpers/documents'
import {
  createMeilisearchClient,
  resetIndex,
  waitForIndexTasksToFinish,
} from './helpers/meilisearch'
import { getIndexedRestaurantByDocumentIdAndLocale } from './helpers/indexed-restaurant'
import { startFixtureApp, stopFixtureApp } from './helpers/fixture-app'
import {
  createTemporaryDatabasePath,
  removeTemporaryDatabasePath,
} from './helpers/tmp-db'

const MIDDLEWARE_ERROR_PREFIX = 'Meilisearch document middleware error:'

/**
 * Assert middleware swallowed-error logs did not trigger during a successful flow.
 *
 * @param {jest.SpyInstance} errorSpy - Spy attached to `strapi.log.error`.
 */
function expectNoMiddlewareErrorLogs(errorSpy) {
  const hasMiddlewareErrorLog = errorSpy.mock.calls.some(([message]) => {
    return (
      typeof message === 'string' && message.includes(MIDDLEWARE_ERROR_PREFIX)
    )
  })

  expect(hasMiddlewareErrorLog).toBe(false)
}

/**
 * Create one restaurant with English and French locale variants, then publish
 * both locales through wildcard publish to exercise wildcard refetch.
 *
 * @returns {Promise<{
 *   documentId: string,
 *   englishTitle: string,
 *   frenchTitle: string,
 * }>}
 */
async function createRestaurantWithEnglishAndFrenchLocales() {
  const englishDocuments = localizedRestaurantDocuments('en')
  const frenchDocuments = localizedRestaurantDocuments('fr')

  const englishTitle = `Restaurant EN ${Date.now()}`
  const frenchTitle = `Restaurant FR ${Date.now()}`

  const createdEnglish = await englishDocuments.create({
    data: {
      title: englishTitle,
    },
  })
  await englishDocuments.publish({ documentId: createdEnglish.documentId })

  await frenchDocuments.update({
    documentId: createdEnglish.documentId,
    data: {
      title: frenchTitle,
    },
  })

  await restaurantDocuments().publish({
    documentId: createdEnglish.documentId,
    locale: '*',
  })

  return {
    documentId: createdEnglish.documentId,
    englishTitle,
    frenchTitle,
  }
}

describe('Localized wildcard indexing behavior', () => {
  let client
  let indexUid
  let dbDirectoryPath
  let dbPath
  let strapi
  let restoreEnvironment
  let logErrorSpy

  beforeAll(async () => {
    const workerId = process.env.JEST_WORKER_ID || '1'
    indexUid = `test_restaurant_i18n_${Date.now()}_${process.pid}_${workerId}`

    client = createMeilisearchClient()
    await resetIndex({ client, indexUid })

    const tempDatabase = await createTemporaryDatabasePath()
    dbDirectoryPath = tempDatabase.dirPath
    dbPath = tempDatabase.dbPath

    const fixtureApp = await startFixtureApp({
      databaseFilename: dbPath,
      indexName: indexUid,
      variant: 'i18n',
    })
    strapi = fixtureApp.strapi
    restoreEnvironment = fixtureApp.restoreEnvironment
  })

  beforeEach(() => {
    logErrorSpy = jest.spyOn(strapi.log, 'error').mockImplementation(() => {})
  })

  afterEach(async () => {
    if (logErrorSpy) {
      logErrorSpy.mockRestore()
      logErrorSpy = undefined
    }
    await resetIndex({ client, indexUid })
  })

  afterAll(async () => {
    await stopFixtureApp({ strapi, restoreEnvironment })
    await removeTemporaryDatabasePath({ dirPath: dbDirectoryPath })
    await client
      .index(indexUid)
      .delete()
      .catch(() => undefined)
  })

  test('publishing an English locale entry indexes only English document', async () => {
    const englishDocuments = localizedRestaurantDocuments('en')
    const englishTitle = `English publish ${Date.now()}`

    const created = await englishDocuments.create({
      data: {
        title: englishTitle,
      },
    })
    await englishDocuments.publish({ documentId: created.documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    const indexedEnglish = await getIndexedRestaurantByDocumentIdAndLocale({
      client,
      indexUid,
      documentId: created.documentId,
      locale: 'en',
    })
    const indexedFrench = await getIndexedRestaurantByDocumentIdAndLocale({
      client,
      indexUid,
      documentId: created.documentId,
      locale: 'fr',
    })

    expect(indexedEnglish).not.toBeNull()
    expect(indexedEnglish.title).toBe(englishTitle)
    expect(indexedFrench).toBeNull()
    expectNoMiddlewareErrorLogs(logErrorSpy)
  })

  test('wildcard publish refetch indexes English and French document variants', async () => {
    const { documentId, englishTitle, frenchTitle } =
      await createRestaurantWithEnglishAndFrenchLocales()

    await waitForIndexTasksToFinish({ client, indexUid })

    const indexedEnglish = await getIndexedRestaurantByDocumentIdAndLocale({
      client,
      indexUid,
      documentId,
      locale: 'en',
    })
    const indexedFrench = await getIndexedRestaurantByDocumentIdAndLocale({
      client,
      indexUid,
      documentId,
      locale: 'fr',
    })

    expect(indexedEnglish).not.toBeNull()
    expect(indexedEnglish.title).toBe(englishTitle)
    expect(indexedFrench).not.toBeNull()
    expect(indexedFrench.title).toBe(frenchTitle)
    expectNoMiddlewareErrorLogs(logErrorSpy)
  })

  test('updating French variant updates only French indexed document', async () => {
    const frenchDocuments = localizedRestaurantDocuments('fr')
    const { documentId, englishTitle } =
      await createRestaurantWithEnglishAndFrenchLocales()

    await waitForIndexTasksToFinish({ client, indexUid })

    const updatedFrenchTitle = `French update ${Date.now()}`

    await frenchDocuments.update({
      documentId,
      data: {
        title: updatedFrenchTitle,
      },
    })
    await frenchDocuments.publish({ documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    const indexedEnglish = await getIndexedRestaurantByDocumentIdAndLocale({
      client,
      indexUid,
      documentId,
      locale: 'en',
    })
    const indexedFrench = await getIndexedRestaurantByDocumentIdAndLocale({
      client,
      indexUid,
      documentId,
      locale: 'fr',
    })

    expect(indexedEnglish).not.toBeNull()
    expect(indexedEnglish.title).toBe(englishTitle)
    expect(indexedFrench).not.toBeNull()
    expect(indexedFrench.title).toBe(updatedFrenchTitle)
    expectNoMiddlewareErrorLogs(logErrorSpy)
  })

  test('deleting French variant removes only French indexed document', async () => {
    const frenchDocuments = localizedRestaurantDocuments('fr')
    const { documentId, englishTitle } =
      await createRestaurantWithEnglishAndFrenchLocales()

    await waitForIndexTasksToFinish({ client, indexUid })

    await frenchDocuments.delete({ documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    const indexedEnglish = await getIndexedRestaurantByDocumentIdAndLocale({
      client,
      indexUid,
      documentId,
      locale: 'en',
    })
    const indexedFrench = await getIndexedRestaurantByDocumentIdAndLocale({
      client,
      indexUid,
      documentId,
      locale: 'fr',
    })

    expect(indexedEnglish).not.toBeNull()
    expect(indexedEnglish.title).toBe(englishTitle)
    expect(indexedFrench).toBeNull()
    expectNoMiddlewareErrorLogs(logErrorSpy)
  })
})
