'use strict'

/**
 * @brief: Map model name into the actual index name in meilisearch instance. it
 * uses `searchIndexName` property from model defnition
 *
 * @param indexUid - this will be equal to model's name
 *
 * @return {String} - Actual index name
 */
function getIndexName(collection, models) {
  const model = models[collection]
  return model.searchIndexName || collection
}

/**
 * @param  {string} collection - Name of the collection
 */
function isCollectionACompositeIndex(collection, models) {
  const model = models[collection]
  // console.log('col', strapi.models[collection])
  const isCompositeIndex = !!model.isUsingCompositeIndex
  return isCompositeIndex
}

async function numberOfRowsInCollection(collection) {
  return (
    strapi.services[collection].count && strapi.services[collection].count()
  )
}

function getMultiEntriesCollections() {
  const services = strapi.services
  return Object.keys(services).filter(type => {
    return services[type].count
  })
}

async function fetchRowBatch({ start, limit, collection }) {
  return await strapi.services[collection].find({
    _limit: limit,
    _start: start,
  })
}

module.exports = {
  fetchRowBatch,
  isCollectionACompositeIndex,
  numberOfRowsInCollection,
  getMultiEntriesCollections,
  getIndexName,
}
