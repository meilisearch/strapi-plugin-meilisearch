'use strict'
const { isObject } = require('../../../utils')
/**
 * Log an error message on a failed action on a collection.
 *
 * @param  {object} options
 * @param  {String} options.collection - Name of the collection.
 * @param  {String} options.action - Action that failed.
 *
 * @returns {[]}
 */
const aborted = ({ collection, action }) => {
  strapi.log.error(
    `Indexing of ${collection} aborted as the data could not be ${action}`
  )
  return [] // return empty array to avoid indexing entries that might contain sensitive data
}

module.exports = ({ strapi }) => {
  const meilisearchConfig = strapi.config.get('plugin.meilisearch') || {}
  return {
    /**
     * Get the name of the index from Meilisearch in which the collection content is added.
     *
     * @param collection - Name of the collection.
     *
     * @return {String} - Index name
     */
    getIndexNameOfCollection: function ({ collection }) {
      const collectionConfig = meilisearchConfig[collection] || {}
      return collectionConfig.indexName || collection
    },

    /**
     * Transform collections entries before indexation in MeiliSearch.
     *
     * @param {object} options
     * @param {string} options.collection - Collection name.
     * @param {Array<Object>} options.entries  - The data to convert. Conversion will use
     * the static method `toSearchIndex` defined in the model definition
     *
     * @return {Array<Object>} - Converted or mapped data
     */
    transformEntries: function ({ collection, entries = [] }) {
      const apiConfig = meilisearchConfig[collection] || {}

      try {
        if (
          Array.isArray(entries) &&
          typeof apiConfig?.transformEntry === 'function'
        ) {
          const transformed = entries.map(entry =>
            apiConfig.transformEntry({
              entry,
              collection,
            })
          )

          if (transformed.length > 0 && !isObject(transformed[0])) {
            return aborted({ collection, action: 'transformed' })
          }
          return transformed
        }
      } catch (e) {
        strapi.log.error(e)
        return aborted({ collection, action: 'transformed' })
      }
      return entries
    },

    /**
     * Filter collections entries before indexation in MeiliSearch.
     *
     * @param {object} options
     * @param {string} options.collection - Collection name.
     * @param {Array<Object>} options.entries  - The data to convert. Conversion will use
     * the static method `toSearchIndex` defined in the model definition
     *
     * @return {Array<Object>} - Converted or mapped data
     */
    filterEntries: function ({ collection, entries = [] }) {
      const collectionConfig = meilisearchConfig[collection] || {}

      try {
        if (
          Array.isArray(entries) &&
          typeof collectionConfig?.filterEntry === 'function'
        ) {
          const filtered = entries.filter(entry =>
            collectionConfig.filterEntry({
              entry,
              collection,
            })
          )

          return filtered
        }
      } catch (e) {
        strapi.log.error(e)
        return aborted({ collection, action: 'filtered' })
      }
      return entries
    },

    /**
     * Returns MeiliSearch index settings from model definition.
     *
     * @param {object} options
     * @param {string} options.collection - Collection name.
     * @param {Array<Object>} [options.entries]  - The data to convert. Conversion will use

     * @typedef Settings
     * @type {import('meilisearch').Settings}
     * @return {Settings} - MeiliSearch index settings
     */
    getSettings: function ({ collection }) {
      const apiConfig = meilisearchConfig[collection] || {}

      const settings = apiConfig.settings || {}
      return settings
    },

    /**
     * Return all collections having the provided indexName setting.
     *
     * @param {object} options
     * @param {string} options.indexName - Index in Meilisearch.
     *
     * @returns {string[]} List of collections storing its data in the provided indexName
     */
    listCollectionsWithCustomIndexName: function ({ indexName }) {
      const contentTypes =
        strapi
          .plugin('meilisearch')
          .service('contentType')
          .getContentTypesName() || []

      const contentTypeWithIndexName = contentTypes.filter(contentType => {
        const name = this.getIndexNameOfCollection({ collection: contentType })
        return name === indexName
      })
      return contentTypeWithIndexName
    },
  }
}
