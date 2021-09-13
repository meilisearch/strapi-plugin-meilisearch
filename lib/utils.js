/*
 * Om Bhrahmarppanam
 * lib/utils.js
 * Created: Mon Sep 13 2021 04:51:07 GMT+0530 (GMT+05:30)
 * Copyright 2021 Harish Karumuthil<harish2704@gmail.com>
 */
'use strict'

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
  return model.searchIndexName || indexUid
}

/**
 * @brief Convert a mode instance into data structure used for indexing.
 *
 * @param indexUid - This is will equal to model's name
 * @param data {Array|Object} - The data to convert. Conversion will use
 * `toSearchIndex` static method defined in the model defnition
 *
 * @return {Array|Object} - converted or mapped data
 */
function cleanData(indexUid, data) {
  const model = strapi.models[indexUid]
  const mapFunction = model.toSearchIndex
  if (!(mapFunction instanceof Function)) {
    return data
  }
  if (Array.isArray(data)) {
    return data.map(mapFunction)
  }
  return mapFunction(data)
}

function calcNumOfDocuments(indexUid, compositeStats) {
  const model = strapi.models[indexUid]
  const isCompositeIndex = model.isUsingCompositeIndex
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
  cleanData,
  calcNumOfDocuments,
}
