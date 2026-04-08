// Ensure integration tests use the real client, not Jest manual mocks.
jest.unmock('meilisearch')

import {
  createMeilisearchClient,
  getDocumentOrNull,
  resetIndex,
  waitForIndexTasksToFinish,
} from './helpers/meilisearch'
import { restaurantDocuments } from './helpers/documents'
import { getIndexedRestaurantByDocumentId } from './helpers/indexed-restaurant'
import { startFixtureApp, stopFixtureApp } from './helpers/fixture-app'
import {
  createTemporaryDatabasePath,
  removeTemporaryDatabasePath,
} from './helpers/tmp-db'

describe('Meilisearch document ID', () => {
  let client
  let indexUid
  let dbDirectoryPath
  let dbPath
  let strapi
  let restoreEnvironment

  beforeAll(async () => {
    const workerId = process.env.JEST_WORKER_ID || '1'
    indexUid = `test_restaurant_id_${Date.now()}_${process.pid}_${workerId}`

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

  test('uses <documentType>-<documentId> as the indexed document id format', async () => {
    const created = await restaurantDocuments().create({
      data: {
        title: `Identity ${Date.now()}`,
      },
    })
    await restaurantDocuments().publish({ documentId: created.documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    const byHelper = await getIndexedRestaurantByDocumentId({
      client,
      indexUid,
      documentId: created.documentId,
    })
    const byPrimaryKey = await getDocumentOrNull({
      client,
      indexUid,
      documentId: `restaurant-${created.documentId}`,
    })

    expect(byHelper).not.toBeNull()
    expect(byPrimaryKey).not.toBeNull()
    expect(byHelper._meilisearch_id).toBe(`restaurant-${created.documentId}`)
    expect(byPrimaryKey._meilisearch_id).toBe(byHelper._meilisearch_id)
  })
})
