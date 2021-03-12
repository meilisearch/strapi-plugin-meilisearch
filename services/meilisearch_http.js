'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

async function addDocuments ({ client, indexUid, data }) {
  return client.index(indexUid).addDocuments(data)
}

async function getIndexes ({ client }) {
  return client.listIndexes()
}

async function waitForPendingUpdate ({ client, updateId, indexUid }) {
  return client.index(indexUid).waitForPendingUpdate(updateId)
}

async function deleteIndex ({ client, indexUid }) {
  return client.deleteIndex(indexUid)
}

async function deleteIndexes ({ client }) {
  const indexes = await getIndexes({ client })
  const deletePromise = indexes.map(index => deleteIndex({ client, indexUid: index.uid }))
  return Promise.all(deletePromise)
}

module.exports = {
  addDocuments,
  getIndexes,
  waitForPendingUpdate,
  deleteIndexes,
  deleteIndex
}
