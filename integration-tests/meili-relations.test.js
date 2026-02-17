// Ensure we use the real meilisearch client, not the mock
jest.unmock('meilisearch')

import { MeiliSearch } from 'meilisearch'

/**
 * Integration test: verify that restaurant relations are correctly indexed in Meilisearch.
 *
 * This test runs against a real Meilisearch instance and a running Strapi playground
 * with seeded data. It verifies that the plugin's document middleware correctly:
 * - Indexes restaurant documents with their related categories
 * - Only includes published categories in the categories array
 * - Uses the correct _meilisearch_id format (restaurant-<id>)
 *
 * Expected seeded data (from playground/pre-seeded-database.db):
 * - Restaurant 3: "First restaurant" with published category "French" (id 2)
 * - Restaurant 4: "Second restaurant" with published category "Chinese" (id 4)
 * - Restaurant 5: "Yet Another One" with published categories "French" (id 2) and "Chinese" (id 4)
 * - Restaurant 7: "Secret restaurant" with no published categories
 *
 * Note: Categories with duplicate names exist in the seed data:
 * - id 1: "French" (unpublished)
 * - id 2: "French" (published)
 * - id 3: "Chinese" (unpublished)
 * - id 4: "Chinese" (published)
 */

// Expected documents based on playground/pre-seeded-database.db
// Only published categories (publishedAt IS NOT NULL) are included
const EXPECTED_DOCUMENTS = {
  'restaurant-3': {
    id: 3,
    documentId: 'mucw8kpobytdk767ulod8vxu',
    title: 'First restaurant',
    categories: ['French'], // Only published French (id 2)
  },
  'restaurant-4': {
    id: 4,
    documentId: 'okjubaltqvkmk3892res485a',
    title: 'Second restaurant',
    categories: ['Chinese'], // Only published Chinese (id 4)
  },
  'restaurant-5': {
    id: 5,
    documentId: 'gztu8dl9j8h5ufidamichiao',
    title: 'Yet Another One',
    categories: ['Chinese', 'French'], // Both published categories (sorted)
  },
  'restaurant-7': {
    id: 7,
    documentId: 'xh0j5yhp03309oycn2ftj9s5',
    title: 'Secret restaurant',
    categories: [], // Unpublished category (id 5) is not included
  },
}

const INDEX_NAME = 'my_restaurant' // From playground/config/plugins.js
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'

/**
 * Wait for all enqueued or processing tasks in Meilisearch to finish.
 *
 * This function polls the Meilisearch task API until no tasks are running.
 * It ensures that all indexing operations have completed before running tests.
 *
 * @param {MeiliSearch} client - The Meilisearch client instance
 * @param {Object} options - Configuration options
 * @param {string} [options.indexUid] - Optional index UID to filter tasks
 * @param {number} [options.timeoutMs=60000] - Timeout in milliseconds
 * @param {number} [options.pollIntervalMs=500] - Poll interval in milliseconds
 * @throws {Error} If tasks don't finish within the timeout period
 */
async function waitForMeilisearchTasksToFinish(
  client,
  { indexUid, timeoutMs = 60000, pollIntervalMs = 500 } = {},
) {
  const start = Date.now()
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { results } = await client.getTasks(
      indexUid ? { indexUids: [indexUid] } : undefined,
    )
    const hasRunning = results.some(
      task =>
        (task.status === 'enqueued' || task.status === 'processing') &&
        (!indexUid || task.indexUid === indexUid),
    )
    if (!hasRunning) return
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out waiting for Meilisearch tasks for index ${indexUid || 'all'}`,
      )
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }
}

async function expectDocumentMissing({
  client,
  indexUid,
  documentId,
  timeoutMs = 10000,
  pollIntervalMs = 300,
}) {
  const start = Date.now()
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await client.index(indexUid).getDocument(documentId)
    } catch (error) {
      if (
        error?.cause?.code === 'document_not_found' ||
        error?.code === 'document_not_found'
      ) {
        return
      }
      throw error
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Document ${documentId} still present in index ${indexUid} after ${timeoutMs}ms`,
      )
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }
}

async function updateRestaurant({ documentId, data }) {
  const response = await fetch(`${STRAPI_URL}/api/restaurants/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Failed to update restaurant ${documentId}: ${response.status} ${text}`,
    )
  }
}

async function deleteRestaurant({ documentId }) {
  const response = await fetch(`${STRAPI_URL}/api/restaurants/${documentId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Failed to delete restaurant ${documentId}: ${response.status} ${text}`,
    )
  }
}

describe('Meilisearch Relations Integration Test', () => {
  let client

  beforeAll(async () => {
    const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700'
    const apiKey = process.env.MEILISEARCH_API_KEY || 'masterKey'

    client = new MeiliSearch({ host, apiKey })

    // Wait for all pending tasks to finish before running tests
    await waitForMeilisearchTasksToFinish(client, { indexUid: INDEX_NAME })
  })

  test('indexes restaurant 3 with its published categories', async () => {
    const index = client.index(INDEX_NAME)
    const doc = await index.getDocument('restaurant-3')
    const expected = EXPECTED_DOCUMENTS['restaurant-3']

    expect(doc.id).toBe(expected.id)
    expect(doc.title).toBe(expected.title)
    expect(doc.categories).toEqual(expect.arrayContaining(expected.categories))
    expect(doc.categories).toHaveLength(expected.categories.length)
  })

  test('indexes restaurant 4 with its published categories', async () => {
    const doc = await client.index(INDEX_NAME).getDocument('restaurant-4')
    const expected = EXPECTED_DOCUMENTS['restaurant-4']

    expect(doc.id).toBe(expected.id)
    expect(doc.title).toBe(expected.title)
    expect(doc.categories).toEqual(expect.arrayContaining(expected.categories))
    expect(doc.categories).toHaveLength(expected.categories.length)
  })

  test('indexes restaurant 5 with its published categories', async () => {
    const doc = await client.index(INDEX_NAME).getDocument('restaurant-5')
    const expected = EXPECTED_DOCUMENTS['restaurant-5']

    expect(doc.id).toBe(expected.id)
    expect(doc.title).toBe(expected.title)
    expect(doc.categories).toEqual(expect.arrayContaining(expected.categories))
    expect(doc.categories).toHaveLength(expected.categories.length)
  })

  test('indexes restaurant 7 with no published categories', async () => {
    const doc = await client.index(INDEX_NAME).getDocument('restaurant-7')
    const expected = EXPECTED_DOCUMENTS['restaurant-7']

    expect(doc.id).toBe(expected.id)
    expect(doc.title).toBe(expected.title)
    expect(doc.categories).toEqual([])
  })

  test('all expected restaurants are indexed', async () => {
    const { results: allDocs } = await client
      .index(INDEX_NAME)
      .getDocuments({ limit: 100 })

    const indexedIds = allDocs.map(doc => doc._meilisearch_id)

    // We expect all 4 seeded restaurants to be indexed
    // (Restaurant 2 is filtered out by filterEntry in playground config)
    expect(indexedIds).toEqual(
      expect.arrayContaining([
        'restaurant-3',
        'restaurant-4',
        'restaurant-5',
        'restaurant-7',
      ]),
    )
  })

  test('updates restaurant 3 title and syncs to Meilisearch', async () => {
    const newTitle = 'First restaurant (updated)'

    await updateRestaurant({
      documentId: EXPECTED_DOCUMENTS['restaurant-3'].documentId,
      data: { title: newTitle },
    })

    await waitForMeilisearchTasksToFinish(client, { indexUid: INDEX_NAME })

    const doc = await client.index(INDEX_NAME).getDocument('restaurant-3')
    expect(doc.title).toBe(newTitle)
  })

  test('deletes restaurant 7 and removes it from Meilisearch', async () => {
    await deleteRestaurant({
      documentId: EXPECTED_DOCUMENTS['restaurant-7'].documentId,
    })

    await waitForMeilisearchTasksToFinish(client, { indexUid: INDEX_NAME })

    await expectDocumentMissing({
      client,
      indexUid: INDEX_NAME,
      documentId: 'restaurant-7',
    })
  })
})
