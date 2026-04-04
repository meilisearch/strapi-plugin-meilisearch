// Ensure integration tests use the real client, not Jest manual mocks.
jest.unmock('meilisearch')

import {
  createMeilisearchClient,
  resetIndex,
  waitForIndexTasksToFinish,
} from './helpers/meilisearch'
import { startFixtureApp, stopFixtureApp } from './helpers/fixture-app'
import {
  createTemporaryDatabasePath,
  removeTemporaryDatabasePath,
} from './helpers/tmp-db'

/**
 * Access the restaurant document service in the fixture app.
 *
 * @returns {ReturnType<any>} Document service client.
 */
function restaurantDocuments() {
  return global.strapi.documents('api::restaurant.restaurant')
}

/**
 * Find an indexed restaurant document using Strapi's `documentId` field.
 *
 * @param {object} options
 * @param {any} options.client - Meilisearch client.
 * @param {string} options.indexUid - Index identifier.
 * @param {string} options.documentId - Strapi document identifier.
 *
 * @returns {Promise<object|null>} Indexed document or null.
 */
async function getIndexedRestaurantByDocumentId({
  client,
  indexUid,
  documentId,
}) {
  const { results } = await client.index(indexUid).getDocuments({ limit: 1000 })

  return results.find(entry => entry.documentId === documentId) || null
}

describe('Strapi fixture regression suite', () => {
  let client
  let indexUid
  let dbDirectoryPath
  let dbPath
  let strapi
  let restoreEnvironment

  beforeAll(async () => {
    const workerId = process.env.JEST_WORKER_ID || '1'
    indexUid = `test_restaurant_${Date.now()}_${process.pid}_${workerId}`

    client = createMeilisearchClient()
    await resetIndex({ client, indexUid })

    const tempDatabase = await createTemporaryDatabasePath()
    dbDirectoryPath = tempDatabase.dirPath
    dbPath = tempDatabase.dbPath

    const fixtureApp = await startFixtureApp({
      databaseFilename: dbPath,
      indexName: indexUid,
    })
    strapi = fixtureApp.strapi
    restoreEnvironment = fixtureApp.restoreEnvironment
  })

  afterEach(async () => {
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

  test('create draft restaurant does not index', async () => {
    const created = await restaurantDocuments().create({
      data: {
        title: `Draft ${Date.now()}`,
      },
    })

    await waitForIndexTasksToFinish({ client, indexUid })

    const indexed = await getIndexedRestaurantByDocumentId({
      client,
      indexUid,
      documentId: created.documentId,
    })

    expect(indexed).toBeNull()
  })

  test('publish restaurant indexes it', async () => {
    const title = `Published ${Date.now()}`
    const created = await restaurantDocuments().create({
      data: { title },
    })

    await restaurantDocuments().publish({ documentId: created.documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    const indexed = await getIndexedRestaurantByDocumentId({
      client,
      indexUid,
      documentId: created.documentId,
    })

    expect(indexed).not.toBeNull()
    expect(indexed.title).toBe(title)
  })

  test('update published restaurant draft does not change indexed published doc yet', async () => {
    const initialTitle = `Initial ${Date.now()}`
    const draftTitle = `Draft update ${Date.now()}`

    const created = await restaurantDocuments().create({
      data: { title: initialTitle },
    })
    await restaurantDocuments().publish({ documentId: created.documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    await restaurantDocuments().update({
      documentId: created.documentId,
      data: { title: draftTitle },
    })
    await waitForIndexTasksToFinish({ client, indexUid })

    const indexed = await getIndexedRestaurantByDocumentId({
      client,
      indexUid,
      documentId: created.documentId,
    })

    expect(indexed).not.toBeNull()
    expect(indexed.title).toBe(initialTitle)
  })

  test('publish updated draft updates Meili', async () => {
    const initialTitle = `Initial publish ${Date.now()}`
    const updatedPublishedTitle = `Published update ${Date.now()}`

    const created = await restaurantDocuments().create({
      data: { title: initialTitle },
    })
    await restaurantDocuments().publish({ documentId: created.documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    await restaurantDocuments().update({
      documentId: created.documentId,
      data: { title: updatedPublishedTitle },
    })
    await waitForIndexTasksToFinish({ client, indexUid })

    await restaurantDocuments().publish({ documentId: created.documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    const indexed = await getIndexedRestaurantByDocumentId({
      client,
      indexUid,
      documentId: created.documentId,
    })

    expect(indexed).not.toBeNull()
    expect(indexed.title).toBe(updatedPublishedTitle)
  })

  test('unpublish removes Meili doc', async () => {
    const created = await restaurantDocuments().create({
      data: {
        title: `To unpublish ${Date.now()}`,
      },
    })
    await restaurantDocuments().publish({ documentId: created.documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    await restaurantDocuments().unpublish({ documentId: created.documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    const indexed = await getIndexedRestaurantByDocumentId({
      client,
      indexUid,
      documentId: created.documentId,
    })

    expect(indexed).toBeNull()
  })
})
