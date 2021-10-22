'use strict'

/**
 * @brief: Map model name into the actual index name in meilisearch instance. it
 * uses `searchIndexName` property from model defnition
 *
 * @param indexUid - this will be equal to model's name
 *
 * @return {String} - Actual index name
 */
function getIndexName(collection) {
  const model = this.models[collection]
  return model.searchIndexName || collection
}

/**
 * @param  {string} collection - Name of the collection
 */
function isCompositeIndex(collection) {
  const model = this.models[collection]
  const isCompositeIndex = !!model.isUsingCompositeIndex
  return isCompositeIndex
}

async function numberOfRows(collection) {
  return this.services[collection].count && this.services[collection].count()
}

function listAllMultiEntriesCollections() {
  return Object.keys(this.services).filter(type => {
    return this.services[type].count
  })
}

async function fetchRowBatch({ start, limit, collection }) {
  return await this.services[collection].find({
    _limit: limit,
    _start: start,
  })
}

module.exports = (services, models) => ({
  services,
  models,
  fetchRowBatch,
  isCompositeIndex,
  numberOfRows,
  listAllMultiEntriesCollections,
  getIndexName,
})
