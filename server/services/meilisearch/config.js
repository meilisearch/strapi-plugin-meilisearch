'use strict'
const { isObject } = require('../../utils')
/**
 * Log an error message on a failed action on a contentType.
 *
 * @param  {object} options
 * @param  {String} options.contentType - Name of the contentType.
 * @param  {String} options.action - Action that failed.
 *
 * @returns {[]}
 */
const aborted = ({ contentType, action }) => {
  strapi.log.error(
    `Indexing of ${contentType} aborted as the data could not be ${action}`
  )
  return [] // return empty array to avoid indexing entries that might contain sensitive data
}

module.exports = ({ strapi }) => {
  const meilisearchConfig = strapi.config.get('plugin.meilisearch') || {}
  const contentTypeService = strapi.plugin('meilisearch').service('contentType')
  return {
    /**
     * Get the name of the index from Meilisearch in which the contentType content is added.
     *
     * @param contentType - Name of the contentType.
     *
     * @return {String} - Index name
     */
    getIndexNameOfContentType: function ({ contentType }) {
      const collection = contentTypeService.getCollectionName({ contentType })

      const contentTypeConfig = meilisearchConfig[collection] || {}
      return contentTypeConfig.indexName || collection
    },

    /**
     * Transform contentTypes entries before indexation in MeiliSearch.
     *
     * @param {object} options
     * @param {string} options.contentType - ContentType name.
     * @param {Array<Object>} options.entries  - The data to convert. Conversion will use
     * the static method `toSearchIndex` defined in the model definition
     *
     * @return {Array<Object>} - Converted or mapped data
     */
    transformEntries: async function ({ contentType, entries = [] }) {
      const collection = contentTypeService.getCollectionName({ contentType })
      const contentTypeConfig = meilisearchConfig[collection] || {}

      try {
        if (
          Array.isArray(entries) &&
          typeof contentTypeConfig?.transformEntry === 'function'
        ) {
          const transformed = await Promise.all(
            entries.map(
              async entry =>
                await contentTypeConfig.transformEntry({
                  entry,
                  contentType,
                })
            )
          )

          if (transformed.length > 0 && !isObject(transformed[0])) {
            return aborted({ contentType, action: 'transformed' })
          }
          return transformed
        }
      } catch (e) {
        strapi.log.error(e)
        return aborted({ contentType, action: 'transformed' })
      }
      return entries
    },

    /**
     * Filter contentTypes entries before indexation in MeiliSearch.
     *
     * @param {object} options
     * @param {string} options.contentType - ContentType name.
     * @param {Array<Object>} options.entries  - The data to convert. Conversion will use
     * the static method `toSearchIndex` defined in the model definition
     *
     * @return {Array<Object>} - Converted or mapped data
     */
    filterEntries: async function ({ contentType, entries = [] }) {
      const collection = contentTypeService.getCollectionName({ contentType })
      const contentTypeConfig = meilisearchConfig[collection] || {}

      try {
        if (
          Array.isArray(entries) &&
          typeof contentTypeConfig?.filterEntry === 'function'
        ) {
          const filtered = await entries.reduce(async (memo, entry) => {
            const result = await contentTypeConfig.filterEntry({
              entry,
              contentType,
            })
            if (!result) return memo
            return [...(await memo), entry]
          }, [])

          return filtered
        }
      } catch (e) {
        strapi.log.error(e)
        return aborted({ contentType, action: 'filtered' })
      }
      return entries
    },

    /**
     * Returns MeiliSearch index settings from model definition.
     *
     * @param {object} options
     * @param {string} options.contentType - ContentType name.
     * @param {Array<Object>} [options.entries]  - The data to convert. Conversion will use

     * @typedef Settings
     * @type {import('meilisearch').Settings}
     * @return {Settings} - MeiliSearch index settings
     */
    getSettings: function ({ contentType }) {
      const collection = contentTypeService.getCollectionName({ contentType })
      const contentTypeConfig = meilisearchConfig[collection] || {}

      const settings = contentTypeConfig.settings || {}
      return settings
    },

    /**
     * Return all contentTypes having the provided indexName setting.
     *
     * @param {object} options
     * @param {string} options.indexName - Index in Meilisearch.
     *
     * @returns {string[]} List of contentTypes storing its data in the provided indexName
     */
    listContentTypesWithCustomIndexName: function ({ indexName }) {
      const contentTypes =
        strapi
          .plugin('meilisearch')
          .service('contentType')
          .getContentTypesUid() || []
      const collectionNames = contentTypes.map(contentType =>
        contentTypeService.getCollectionName({ contentType })
      )
      const contentTypeWithIndexName = collectionNames.filter(contentType => {
        const name = this.getIndexNameOfContentType({
          contentType,
        })
        return name === indexName
      })
      return contentTypeWithIndexName
    },

    removeSensitiveFields: function ({ entries }) {
      return entries.map(entry => {
        delete entry.createdBy
        delete entry.updatedBy
        return entry
      })
    },
  }
}
