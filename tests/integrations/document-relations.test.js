// Ensure integration tests use the real client, not Jest manual mocks.
jest.unmock('meilisearch')

import {
  createMeilisearchClient,
  resetIndex,
  waitForIndexTasksToFinish,
} from './helpers/meilisearch'
import { categoryDocuments, restaurantDocuments } from './helpers/documents'
import { getIndexedRestaurantByDocumentId } from './helpers/indexed-restaurant'
import { startFixtureApp, stopFixtureApp } from './helpers/fixture-app'
import {
  createTemporaryDatabasePath,
  removeTemporaryDatabasePath,
} from './helpers/tmp-db'

/**
 * Assert the published restaurant includes the expected number of published categories.
 *
 * @param {object} options
 * @param {string} options.documentId
 * @param {number} options.expectedCount
 */
async function assertPublishedRestaurantCategoriesForIndexing({
  documentId,
  expectedCount,
}) {
  const reread = await restaurantDocuments().findOne({
    documentId,
    status: 'published',
    populate: {
      categories: {
        fields: ['name', 'publishedAt', 'documentId'],
      },
    },
  })
  const related = reread?.categories
  const baseMsg =
    `Expected published restaurant ${documentId} to populate ${expectedCount} categories with publishedAt set ` +
    `(only published related categories should be indexed). Got: ${JSON.stringify(related)}`
  if (!Array.isArray(related) || related.length !== expectedCount) {
    throw new Error(baseMsg)
  }
  for (const cat of related) {
    if (cat?.publishedAt == null) {
      throw new Error(
        `${baseMsg}; category documentId=${cat?.documentId} missing publishedAt`,
      )
    }
  }
}

/**
 * Assert the draft row has the expected number of category links.
 *
 * @param {object} options
 * @param {string} options.documentId
 * @param {number} options.expectedCount
 */
async function assertRestaurantDraftCategoryLinkCount({
  documentId,
  expectedCount,
}) {
  const reread = await restaurantDocuments().findOne({
    documentId,
    status: 'draft',
    populate: {
      categories: {
        fields: ['documentId'],
      },
    },
  })
  const related = reread?.categories
  const msg = `Expected draft restaurant ${documentId} to link ${expectedCount} categories after connect. Got: ${JSON.stringify(related)}`
  if (!Array.isArray(related) || related.length !== expectedCount) {
    throw new Error(msg)
  }
}

describe('Indexing Strapi documents with relations', () => {
  let client
  let indexUid
  let dbDirectoryPath
  let dbPath
  let strapi
  let restoreEnvironment

  beforeAll(async () => {
    const workerId = process.env.JEST_WORKER_ID || '1'
    indexUid = `test_restaurant_rel_${Date.now()}_${process.pid}_${workerId}`

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

  test('indexes published related categories as flattened name strings', async () => {
    const suffix = Date.now()
    const catA = await categoryDocuments().create({
      data: { name: `Alpha ${suffix}` },
    })
    const catB = await categoryDocuments().create({
      data: { name: `Beta ${suffix}` },
    })
    await categoryDocuments().publish({ documentId: catA.documentId })
    await categoryDocuments().publish({ documentId: catB.documentId })

    const created = await restaurantDocuments().create({
      data: { title: `R ${suffix}` },
    })
    await restaurantDocuments().publish({ documentId: created.documentId })

    await restaurantDocuments().update({
      documentId: created.documentId,
      data: {
        categories: {
          connect: [
            { documentId: catA.documentId },
            { documentId: catB.documentId },
          ],
        },
      },
    })

    await assertRestaurantDraftCategoryLinkCount({
      documentId: created.documentId,
      expectedCount: 2,
    })

    await restaurantDocuments().publish({ documentId: created.documentId })

    await assertPublishedRestaurantCategoriesForIndexing({
      documentId: created.documentId,
      expectedCount: 2,
    })

    await restaurantDocuments().update({
      documentId: created.documentId,
      data: { title: `R ${suffix} (reindex)` },
    })

    await waitForIndexTasksToFinish({ client, indexUid })

    const indexed = await getIndexedRestaurantByDocumentId({
      client,
      indexUid,
      documentId: created.documentId,
    })

    expect(indexed).not.toBeNull()
    expect(Array.isArray(indexed.categories)).toBe(true)
    expect(indexed.categories).toHaveLength(2)
    expect(indexed.categories.sort()).toEqual(
      [`Alpha ${suffix}`, `Beta ${suffix}`].sort(),
    )
  })

  test('draft-only linked categories yield an empty categories array in Meili', async () => {
    const suffix = Date.now()
    const draftCat = await categoryDocuments().create({
      data: { name: `DraftOnly ${suffix}` },
    })

    const created = await restaurantDocuments().create({
      data: {
        title: `R draft cat ${suffix}`,
        categories: {
          connect: [{ documentId: draftCat.documentId }],
        },
      },
    })

    await assertRestaurantDraftCategoryLinkCount({
      documentId: created.documentId,
      expectedCount: 1,
    })

    await restaurantDocuments().publish({ documentId: created.documentId })
    await waitForIndexTasksToFinish({ client, indexUid })

    const indexed = await getIndexedRestaurantByDocumentId({
      client,
      indexUid,
      documentId: created.documentId,
    })

    expect(indexed).not.toBeNull()
    expect(indexed.categories).toEqual([])
  })
})
