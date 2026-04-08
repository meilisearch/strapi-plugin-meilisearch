// Ensure integration tests use the real client, not Jest manual mocks.
jest.unmock('meilisearch')

import {
  createMeilisearchClient,
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

describe('Strapi document draft and publish lifecycle', () => {
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

  test('creating a draft entry does not index it', async () => {
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

  test('publishing a draft entry indexes it', async () => {
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

  test('updating a published entry as draft does not change indexed doc', async () => {
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

  test('republishing after a draft update updates the indexed document', async () => {
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

  test('unpublishing removes the indexed document', async () => {
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

  test('deleting an indexed document removes it from Meilisearch', async () => {
    const created = await restaurantDocuments().create({
      data: {
        title: `To delete ${Date.now()}`,
      },
    })
    await restaurantDocuments().publish({ documentId: created.documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    const beforeDelete = await getIndexedRestaurantByDocumentId({
      client,
      indexUid,
      documentId: created.documentId,
    })
    expect(beforeDelete).not.toBeNull()

    await restaurantDocuments().delete({ documentId: created.documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    const afterDelete = await getIndexedRestaurantByDocumentId({
      client,
      indexUid,
      documentId: created.documentId,
    })
    expect(afterDelete).toBeNull()
  })
})
