'use strict'

module.exports = ({ services, models }) => {
  return {
    validateModelConfiguration: function (collection) {
      const warnings = []
      const model = models[collection]
      const config = model && model.meilisearch

      if (config !== null) {
        const { searchIndexName, transformEntry } = model

        if (searchIndexName && searchIndexName !== typeof 'string') {
          warnings.push(`searchIndexName in ${collection} must be a string`)
        }

        if (searchIndexName && transformEntry instanceof Function) {
          warnings.push(
            `transformEntry in ${collection} must be a function returning an entry`
          )
        }
      }

      return warnings
    },
    validateConfigurations: function () {
      const exclude = ['single-type-test', 'core_store', 'strapi_webhooks']

      // models.restaurant.prototype => donne l info de si il est publish hehe

      // `...` is used to remove protype funtion of models
      const { meilisearch } = models.restaurant?.meilisearch
      console.log(meilisearch)
      for (const collection in models) {
        console.log(this.searchIndexName(collection))
      }
      // const config = models[collection].meilisearch || {}
      // console.log(config)
    },
    /**
     * @brief: Map model name into the actual index name in meilisearch instance. it
     * uses `searchIndexName` property from model defnition
     *
     * @param collection - Name of the Collection.
     *
     * @return {String} - Actual index name
     */
    getIndexName: function (collection) {
      const model = models[collection].meilisearch || {}
      return model.searchIndexName || collection
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
      console.log('AJKAHSKJH')
      const model = models[collection].meilisearch || {}
      const { transformEntry } = model
      console.log(typeof transformEntry)
      if (!transformEntry) {
        console.log('bah alors')
        return entries
      }
      try {
        if (Array.isArray(entries)) {
          return entries.map(x => model.transformEntry(x))
        }
      } catch (e) {
        console.warn('test')
        return entries
      }
      return entries
    },
  }
}
