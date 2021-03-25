'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

function removeDateLogs (document) {
  const {
    updated_at: omitUpdatedAt,
    created_at: omitCreatedAt,
    created_by: omitCreatedBy,
    updated_by: omitUpdatedBy,
    ...noDateLogDocument
  } = document
  return noDateLogDocument
}

async function addDocuments ({ indexUid, data }) {
  const noDateLogDocuments = data.map(document => removeDateLogs(document))
  return this.client.index(indexUid).addDocuments(noDateLogDocuments)
}

async function deleteDocuments ({ indexUid, documentIds }) {
  return this.client.index(indexUid).deleteDocuments(documentIds)
}

async function deleteAllDocuments ({ indexUid }) {
  return this.client.index(indexUid).deleteAllDocuments()
}

async function getIndexes () {
  return this.client.listIndexes()
}

async function getRawIndex ({ indexUid }) {
  return this.client.index(indexUid).getRawInfo()
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
    deleteIndex,
    deleteDocuments,
    getRawIndex,
    deleteAllDocuments
  }
)
