/**
 * @brief: Map model name into the actual index name in meilisearch instance. it
 * uses `searchIndexName` property from model defnition
 *
 * @param indexUid - this will be equal to model's name
 *
 * @return {String} - Actual index name
 */
function getIndexName(indexUid) {
  const model = strapi.models[indexUid]
  // console.log('getIndexName', { models: model.searchIndexName, indexUid })
  return model.searchIndexName || indexUid
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

  // If the index is not ca composite index, do nothing
  if (!isCompositeIndex) {
    return compositeStats
  }
  const typeIdentifier = model.searchIndexTypeId
  if (typeof typeIdentifier !== 'string') {
    throw new Error(
      `Models with composite index should specify 'searchIndexTypeId'`
    )
  }
  return {
    numberOfDocuments: compositeStats.fieldDistribution[typeIdentifier] || 0,
    isIndexing: compositeStats.isIndexing,
  }
}

module.exports = {
  getIndexName,
  calcNumOfDocuments,
}
