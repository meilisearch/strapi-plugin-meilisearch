'use strict'

/**
 * @brief: Map model name into the actual index name in meilisearch instance. it
 * uses `searchIndexName` property of the model definition
 *
 * @param indexUid - this will be equal to model's name
 *
 * @return {String} - Actual index name
 */
function getIndexName(indexUid) {
  const model = strapi.models[indexUid]
  return model.searchIndexName || indexUid
}

/**
 * @brief Convert a mode instance into data structure used for indexing.
 *
 * @param indexUid - This is will equal to model's name
 * @param data {Array|Object} - The data to convert. Conversion will use
 * the static method `toSearchIndex` defined in the model definition
 *
 * @return {Array|Object} - Converted or mapped data
 */
function cleanData(indexUid, data) {
  const model = strapi.models[indexUid]
  const mapFunction = model.toSearchIndex
  if (!(mapFunction instanceof Function)) {
    return data
  }
  if (Array.isArray(data)) {
    data.map(mapFunction)
    return data.map(mapFunction)
  }
  return mapFunction(data)
}

function isCollectionACompositeIndex({ collection }) {
  const model = strapi.models[collection]
  const isCompositeIndex = model.isUsingCompositeIndex
  return isCompositeIndex
}

/**
 * @brief Calculate number of records in an index while considering the case of
 * composite indexes.
 *
 * @description Calculating record count for each model from a composite index is tricky.
 * For this to work, each model should set a unique field which is specific to
 * that particular model. For eg: for a model `MyModel` it can export a field for
 * eg: `$is_mymodel` = 1
 * The stats returned from the meilisearch will have count of individual fields
 * and we can calculate model's record count by counting that statistics data
 *
 * @param indexUid - This is will equal to model's name
 * @param compositeStats - Stats data retrieved from meilisearch client
 *
 * @return {Object} - { numberOfDocuments, isIndexing }
 */
function calcNumOfDocuments(indexUid, compositeStats) {
  const model = strapi.models[indexUid]
  const isCompositeIndex = model.isUsingCompositeIndex
  // console.log({ indexUid, isCompositeIndex })

  // If the index is not ca composite index, do nothing
  if (!isCompositeIndex) {
    return compositeStats
  }
  const typeIdentifier = model.searchIndexTypeId
  // console.log({ typeIdentifier })
  if (typeof typeIdentifier !== 'string') {
    throw new Error(
      `Models with composite index should specify 'searchIndexTypeId'`
    )
  }
  // console.log({ compositeStats })
  return {
    numberOfDocuments: compositeStats.fieldDistribution[typeIdentifier] || 0,
    isIndexing: compositeStats.isIndexing,
  }
}

module.exports = {
  getIndexName,
  cleanData,
  calcNumOfDocuments,
  isCollectionACompositeIndex,
}
