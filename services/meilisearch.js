'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

function removeDateLogs(document) {
  const {
    updated_at: omitUpdatedAt,
    created_at: omitCreatedAt,
    created_by: omitCreatedBy,
    updated_by: omitUpdatedBy,
    published_at: omitPublishedAt,
    ...noDateLogDocument
  } = document
  return noDateLogDocument
}

async function addDocuments({ indexUid, data }) {
  const noDateLogDocuments = data.map(document => removeDateLogs(document))
  return this.client.index(indexUid).addDocuments(noDateLogDocuments)
}

async function deleteDocuments({ indexUid, documentIds }) {
  return this.client.index(indexUid).deleteDocuments(documentIds)
}

async function deleteAllDocuments({ indexUid }) {
  return this.client.index(indexUid).deleteAllDocuments()
}

async function getIndexes() {
  return this.client.listIndexes()
}

async function createIndex({ indexUid }) {
  return this.client.getOrCreateIndex(indexUid)
}

async function getRawIndex({ indexUid }) {
  return this.client.index(indexUid).getRawInfo()
}

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

async function waitForPendingUpdate({ updateId, indexUid }) {
  return this.client
    .index(indexUid)
    .waitForPendingUpdate(updateId, { intervalMs: 500 })
}

async function deleteIndex({ indexUid }) {
  return this.client.deleteIndex(indexUid)
}

async function deleteIndexes() {
  const indexes = await getIndexes()
  const deletePromise = indexes.map(index => this.client.deleteIndex(index.uid))
  return Promise.all(deletePromise)
}

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
    deleteIndexes,
    deleteIndex,
    deleteDocuments,
    getRawIndex,
    deleteAllDocuments,
    createIndex,
    waitForPendingUpdates,
    getStats,
  }
}
