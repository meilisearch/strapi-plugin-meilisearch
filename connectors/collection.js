'use strict'

module.exports = ({ services, models, logger }) => {
  return {
    /**
     * Apply an action on all the entries of the provided collection.
     *
     * @param  {string} collection
     * @param  {function} callback - Function applied on each entry of the collection
     *
     * @returns {any[]} - List of all the returned elements from the callback.
     */
    actionInBatches: async function (collection, callback) {
      const BATCH_SIZE = 500
      const entries_count = await this.numberOfEntries(collection)
      const response = []

      for (let index = 0; index <= entries_count; index += BATCH_SIZE) {
        const entries =
          (await this.getEntriesBatch({
            start: index,
            limit: BATCH_SIZE,
            collection, // Envoie restaurant
          })) || []
        const info = await callback(entries, collection)
        if (info != null) response.push(info)
      }
      return response
    },

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
     * Return all collections having the provided indexName setting.
     *
     * @param  {string} indexName
     */
    listCollectionsWithIndexName: async function (indexName) {
      // Is collection not single-type-collection
      const multiRowsCollections = this.allElligbleCollections() || []
      const collectionsWithIndexName = multiRowsCollections.filter(
        collection => this.getIndexName(collection) === indexName
      )
      return collectionsWithIndexName
    },

    /**
     * Number of entries in a collection.
     *
     * @param  {string} collection - Name of the collection.
     *
     * @returns  {number}
     */
    numberOfEntries: async function (collection) {
      if (services[collection].count) return services[collection].count()
      else 0
    },

    /**
     * Lists all the collection that are of type `multi-entries`.
     * As opposition with `single` typed collections.
     *
     * @returns  {string[]} collections
     */
    allElligbleCollections: function () {
      const elligibleCollections = Object.keys(services).filter(type => {
        return services[type].count
      })
      return elligibleCollections
    },

    /**
     * Returns the total number of entries of the collections.
     *
     * @param  {string[]} collections
     *
     * @returns {number} Total entries number.
     */
    totalNumberOfEntries: async function (collections) {
      let collectionsEntriesSize = await Promise.all(
        collections.map(async col => await this.numberOfEntries(col))
      )
      return collectionsEntriesSize.reduce((acc, curr) => (acc += curr), 0)
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
      return (
        (await services[collection].find({
          _limit: limit,
          _start: start,
        })) || []
      )
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
    transformEntries: function ({ collection, entries }) {
      const meilisearchConfig = models[collection].meilisearch || {}
      const { transformEntry } = meilisearchConfig

      if (!transformEntry) {
        return entries
      }
      try {
        if (Array.isArray(entries)) {
          return entries.map(entry =>
            meilisearchConfig.transformEntry({
              entry,
              model: models[collection],
              collection,
            })
          )
        }
      } catch (e) {
        console.log(e)
        return entries
      }
      return entries
    },
  }
}
