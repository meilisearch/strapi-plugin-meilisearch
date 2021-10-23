'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

/**
 * Add documents in an index.
 *
 * @param  {string} indexUid - Index name.
 * @param  {object[]} documents - Documents to add in the index.
 *
 * @returns { { updateId: number } | undefined }
 */
async function addDocuments({ indexUid, documents }) {
  if (documents.length > 0) {
    return this.client.index(indexUid).addDocuments(documents)
  }
}

/**
 * Delete a set of documents from an index.
 *
 * @param  {string} indexUid - Index name.
 * @param  {number[]} documentIds - List of documents ids to remove.
 *
 * @returns {{ updateId: number }}
 */
async function deleteDocuments({ indexUid, documentIds }) {
  console.log(documentIds)
  return this.client.index(indexUid).deleteDocuments(documentIds)
}

/**
 * Delete all documents from an index.
 *
 * @param  {string} indexUid - Index name.
 *
 * @returns {{ updateId: number }}
 */
async function deleteAllDocuments({ indexUid }) {
  return this.client.index(indexUid).deleteAllDocuments()
}

/**
 * Get all indexes in the MeiliSearch instance.
 *
 * @returns { object[] } - Indexes array.
 */
async function getIndexes() {
  try {
    return await this.client.getIndexes()
  } catch (e) {
    return []
  }
}

/**
 * Create an index in MeiliSearch.
 *
 * @param  {string} indexUid - Index name.
 *
 * @returns { object } - Index object.
 */
async function createIndex({ indexUid }) {
  return this.client.getOrCreateIndex(indexUid)
}

/**
 * Wait for a number of update to be processed in MeiliSearch.
 *
 * Because collection entries are added in batches a lot of updates are created.
 * To avoid having to wait for all of them tobe processed, this functions watched a certain
 * number of it at a time.
 *
 * This gives the possibility to the front-end to show the progress of entries indexation.
 *
 * @param  {string} indexUid - Index name.
 * @param  {number} updateNbr - Number of updates to watch.
 *
 * @returns {number} - Number of documents added.
 */
async function waitForPendingUpdates({ indexUid, updateNbr }) {
  const updates = (await this.client.index(indexUid).getAllUpdateStatus())
    .filter(update => update.status === 'enqueued')
    .slice(0, updateNbr)
  let documentsAdded = 0
  for (const update of updates) {
    const { updateId } = update
    const task = await this.client
      .index(indexUid)
      .waitForPendingUpdate(updateId, { intervalMs: 500 })
    const {
      type: { number },
    } = task
    documentsAdded += number
  }
  return documentsAdded
}

/**
 * Watch one update in MeiliSearch.
 *
 * @param  {string} indexUid - Index name.
 * @param  {number} indexUid - Update id.
 *
 * @returns { object } - Update status.
 */
async function waitForPendingUpdate({ updateId, indexUid }) {
  return this.client
    .index(indexUid)
    .waitForPendingUpdate(updateId, { intervalMs: 500 })
}

/**
 * Remove an index from MeiliSearch.
 *
 * @param  {string} indexUid - Index name.
 */
async function deleteIndex({ indexUid }) {
  return this.client.deleteIndex(indexUid)
}

/**
 * Return the stats of an index.
 *
 * @param  {string} indexUid - Index name.
 *
 * @returns { object } - Stats object.
 */
async function getStats({ indexUid }) {
  const stats = await this.client.index(indexUid).getStats()
  return stats
}

module.exports = client => {
  return {
    client,
    addDocuments,
    getIndexes,
    waitForPendingUpdate,
    deleteIndex,
    deleteDocuments,
    deleteAllDocuments,
    createIndex,
    waitForPendingUpdates,
    getStats,
  }
}
