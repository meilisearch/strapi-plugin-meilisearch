'use strict'

/**
 * @brief: Map model name into the actual index name in meilisearch instance. it
 * uses `searchIndexName` property from model defnition
 *
 * @param collection - Name of the Collection.
 *
 * @return {String} - Actual index name
 */
function getIndexName(collection) {
  const model = this.models[collection]
  return model.searchIndexName || collection
}

/**
 * WIP
 * Check wether a collection is a composite or not.
 *
 * @param  {string} collection - Name of the collection.
 */
function isCompositeIndex(collection) {
  const model = this.models[collection]
  const isCompositeIndex = !!model.isUsingCompositeIndex
  return isCompositeIndex
}
/**
 * Number of entries in a collection.
 *
 * @param  {string} collection - Name of the collection.
 *
 * @returns  {number}
 */
async function numberOfEntries(collection) {
  return this.services[collection].count && this.services[collection].count()
}

/**
 * Lists all the collection that are of type `multi-entries`.
 * As opposition with `single` typed collections.
 *
 * @returns  {string[]} collections
 */
function listAllMultiEntriesCollections() {
  return Object.keys(this.services).filter(type => {
    return this.services[type].count
  })
}

/**
 * Returns a batch of entries.
 *
 * @param  {object} batchOptions
 * @param  {number} start - Starting batch number.
 * @param  {number} limit - Size of batch.
 * @param  {string} collection - Collection name.
 *
 * @returns  {object[]} - Entries.
 */
async function getEntriesBatch({ start, limit, collection }) {
  return await this.services[collection].find({
    _limit: limit,
    _start: start,
  })
}

module.exports = (services, models) => ({
  services,
  models,
  getEntriesBatch,
  isCompositeIndex,
  numberOfEntries,
  listAllMultiEntriesCollections,
  getIndexName,
})
