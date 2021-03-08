'use strict'

const { MeiliSearch } = require('meilisearch')

const getClient = (config) => new MeiliSearch(config)

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

async function addDocuments ({ config, indexUid, data }) {
  const client = getClient(config)
  return client.index(indexUid).addDocuments(data)
}

async function getIndexes ({ config }) {
  const client = getClient(config)
  return client.listIndexes()
}

async function waitForPendingUpdate ({ config, updateId, indexUid }) {
  const client = getClient(config)
  return client.index(indexUid).waitForPendingUpdate(updateId)
}

async function deleteIndex ({ config, indexUid }) {
  const client = getClient(config)
  return client.deleteIndex(indexUid)
}

async function deleteIndexes ({ config }) {
  const indexes = await getIndexes({ config })
  const deletePromise = indexes.map(index => deleteIndex({ config, indexUid: index.uid }))
  return Promise.all(deletePromise)
}

module.exports = {
  addDocuments,
  getIndexes,
  waitForPendingUpdate,
  deleteIndexes,
  deleteIndex
}
