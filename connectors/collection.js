'use strict'

module.exports = ({ services, models, logger }) => {
  return {
    /**
     * @brief: Map model name into the actual index name in meilisearch instance. it
     * uses `indexName` property from model defnition
     *
     * @param collection - Name of the Collection.
     *
     * @return {String} - Actual index name
     */
    getIndexName: function (collection) {
      const model = models[collection].meilisearch || {}
      const indexName = model.indexName || collection
      if (typeof indexName !== 'string') {
        logger.warn(
          `[MEILISEARCH]: "indexName" setting provided in the model of the ${collection} must be a string.`
        )
        return collection
      }
      return indexName
    },

    /**
     * WIP
     * Check wether a collection is a composite or not.
     *
     * @param  {string} collection - Name of the collection.
     */
    isCompositeIndex: function (collection) {
      const model = models[collection].meilisearch || {}
      const isCompositeIndex = !!model.isUsingCompositeIndex
      return isCompositeIndex
    },

    /**
     * Number of entries in a collection.
     *
     * @param  {string} collection - Name of the collection.
     *
     * @returns  {number}
     */
    numberOfEntries: async function (collection) {
      return services[collection].count && services[collection].count()
    },

    /**
     * Lists all the collection that are of type `multi-entries`.
     * As opposition with `single` typed collections.
     *
     * @returns  {string[]} collections
     */
    listAllMultiEntriesCollections: function () {
      return Object.keys(services).filter(type => {
        return services[type].count
      })
    },

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
    getEntriesBatch: async function ({ start, limit, collection }) {
      return await services[collection].find({
        _limit: limit,
        _start: start,
      })
    },

    /**
     * Transform collection entries before indexation in MeiliSearch.
     *
     * @param {string} collection - Collection name.
     * @param {Array<Object>} data  - The data to convert. Conversion will use
     * the static method `toSearchIndex` defined in the model definition
     *
     * @return {Array<Object>} - Converted or mapped data
     */
    transformEntries: function (collection, entries) {
      const meilisearchConfig = models[collection].meilisearch || {}
      const { transformEntry } = meilisearchConfig
      if (!transformEntry) {
        return entries
      }
      try {
        if (Array.isArray(entries)) {
          return entries.map(entry =>
            meilisearchConfig.transformEntry(entry, models[collection])
          )
        }
      } catch (e) {
        return entries
      }
      return entries
    },
  }
}
