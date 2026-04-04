import { MeiliSearch } from 'meilisearch'

/**
 * Build a Meilisearch client from test environment variables.
 *
 * @returns {MeiliSearch} Meilisearch client instance.
 */
export function createMeilisearchClient() {
  const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700'
  const apiKey = process.env.MEILISEARCH_API_KEY || 'masterKey'

  return new MeiliSearch({ host, apiKey })
}

/**
 * Wait until no tasks are enqueued/processing for a specific index.
 *
 * @param {object} options
 * @param {MeiliSearch} options.client - Meilisearch client.
 * @param {string} options.indexUid - Index identifier.
 * @param {number} [options.timeoutMs=60000] - Maximum wait time.
 * @param {number} [options.pollIntervalMs=250] - Polling interval.
 *
 * @returns {Promise<void>}
 */
export async function waitForIndexTasksToFinish({
  client,
  indexUid,
  timeoutMs = 60000,
  pollIntervalMs = 250,
}) {
  const start = Date.now()

  while (true) {
    const { results } = await client.getTasks({ indexUids: [indexUid] })
    const hasRunningTasks = results.some(
      task => task.status === 'enqueued' || task.status === 'processing',
    )

    if (!hasRunningTasks) return

    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out waiting for Meilisearch tasks for index "${indexUid}"`,
      )
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }
}

/**
 * Delete and recreate the index to guarantee a clean state.
 *
 * @param {object} options
 * @param {MeiliSearch} options.client - Meilisearch client.
 * @param {string} options.indexUid - Index identifier.
 *
 * @returns {Promise<void>}
 */
export async function resetIndex({ client, indexUid }) {
  await client
    .index(indexUid)
    .delete()
    .catch(() => undefined)
  await client.createIndex(indexUid, { primaryKey: '_meilisearch_id' })
  await waitForIndexTasksToFinish({ client, indexUid })
}

/**
 * Read a document from Meilisearch, returning null if it does not exist.
 *
 * @param {object} options
 * @param {MeiliSearch} options.client - Meilisearch client.
 * @param {string} options.indexUid - Index identifier.
 * @param {string} options.documentId - Document identifier in Meilisearch.
 *
 * @returns {Promise<object|null>} Indexed document or null when missing.
 */
export async function getDocumentOrNull({ client, indexUid, documentId }) {
  try {
    return await client.index(indexUid).getDocument(documentId)
  } catch (error) {
    if (
      error?.code === 'document_not_found' ||
      error?.cause?.code === 'document_not_found'
    ) {
      return null
    }
    throw error
  }
}
