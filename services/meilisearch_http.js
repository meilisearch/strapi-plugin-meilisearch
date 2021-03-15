'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

async function addDocuments ({ indexUid, data }) {
  return this.client.index(indexUid).addDocuments(data)
}

async function getIndexes () {
  return this.client.listIndexes()
}

async function waitForPendingUpdate ({ updateId, indexUid }) {
  return this.client.index(indexUid).waitForPendingUpdate(updateId)
}

async function deleteIndex ({ indexUid }) {
  return this.client.deleteIndex(indexUid)
}

async function deleteIndexes () {
  const indexes = await getIndexes()
  const deletePromise = indexes.map(index => deleteIndex({ indexUid: index.uid }))
  return Promise.all(deletePromise)
}

module.exports = (client) => (
  {
    client,
    addDocuments,
    getIndexes,
    waitForPendingUpdate,
    deleteIndexes,
    deleteIndex
  }
)
