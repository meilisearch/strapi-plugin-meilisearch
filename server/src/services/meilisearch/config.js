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
    `Indexing of ${contentType} aborted as the data could not be ${action}`,
  )
  return [] // return empty array to avoid indexing entries that might contain sensitive data
}

module.exports = ({ strapi }) => {
  const meilisearchConfig = strapi.config.get('plugin::meilisearch') || {}
  const contentTypeService = strapi.plugin('meilisearch').service('contentType')
  return {
    /**
     * Get the names of the indexes from Meilisearch in which the contentType content is added.
     *
     * @param {object} options
     * @param {string} options.contentType - ContentType name.
     *
     * @return {String[]} - Index names
     */
    getIndexNamesOfContentType: function ({ contentType }) {
      const collection = contentTypeService.getCollectionName({ contentType })

      const contentTypeConfig = meilisearchConfig[collection] || {}

      let indexNames = [contentTypeConfig.indexName]
        .flat(2)
        .filter(index => index)

      return indexNames.length > 0 ? indexNames : [collection]
    },

    /**
     * Get the entries query rule of a content-type that are applied when fetching entries in the Strapi database.
     *
     * @param {object} options
     * @param {string} options.contentType - ContentType name.
     *
     * @return {String} - EntriesQuery rules.
     */
    entriesQuery: function ({ contentType }) {
      const collection = contentTypeService.getCollectionName({ contentType })
      const contentTypeConfig = meilisearchConfig[collection] || {}

      return contentTypeConfig.entriesQuery || {}
    },

    /**
     * Transform contentTypes entries before indexation in Meilisearch.
     *
     * @param {object} options
     * @param {string} options.contentType - ContentType name.
     * @param {Array<Object>} options.entries  - The data to convert. Conversion will use
     * the static method `toSearchIndex` defined in the model definition
     *
     * @return {Promise<Array<Object>>} - Converted or mapped data
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
                }),
            ),
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
     * Filter contentTypes entries before indexation in Meilisearch.
     *
     * @param {object} options
     * @param {string} options.contentType - ContentType name.
     * @param {Array<Object>} options.entries  - The data to convert. Conversion will use
     * the static method `toSearchIndex` defined in the model definition
     *
     * @return {Promise<Array<Object>>} - Converted or mapped data
     */
    filterEntries: async function ({ contentType, entries = [] }) {
      const collection = contentTypeService.getCollectionName({ contentType })
      const contentTypeConfig = meilisearchConfig[collection] || {}

      try {
        if (
          Array.isArray(entries) &&
          typeof contentTypeConfig?.filterEntry === 'function'
        ) {
          const filtered = await entries.reduce(
            async (filteredEntries, entry) => {
              const isValid = await contentTypeConfig.filterEntry({
                entry,
                contentType,
              })

              // If the entry does not answers the predicate
              if (!isValid) return filteredEntries

              const syncFilteredEntries = await filteredEntries
              return [...syncFilteredEntries, entry]
            },
            [],
          )
          return filtered
        }
      } catch (e) {
        strapi.log.error(e)
        return aborted({ contentType, action: 'filtered' })
      }
      return entries
    },

    /**
     * Returns Meilisearch index settings from model definition.
     *
     * @param {object} options
     * @param {string} options.contentType - ContentType name.
     * @param {Array<Object>} [options.entries]  - The data to convert. Conversion will use

     * @typedef Settings
     * @type {import('meilisearch').Settings}
     * @return {Settings} - Meilisearch index settings
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
        contentTypeService.getCollectionName({ contentType }),
      )
      const contentTypeWithIndexName = collectionNames.filter(contentType => {
        const names = this.getIndexNamesOfContentType({
          contentType,
        })
        return names.includes(indexName)
      })
      return contentTypeWithIndexName
    },

    /**
     * Remove sensitive fields (password, author, etc, ..) from entry.
     *
     * @param {object} options
     * @param {Array<Object>} options.entries - The entries to sanitize
     *
     *
     * @return {Array<Object>} - Entries
     */
    removeSensitiveFields: function ({ contentType, entries }) {
      const collection = contentTypeService.getCollectionName({ contentType })
      const contentTypeConfig = meilisearchConfig[collection] || {}

      const noSanitizePrivateFields =
        contentTypeConfig.noSanitizePrivateFields || []

      if (noSanitizePrivateFields.includes('*')) {
        return entries
      }

      // TODO: should be persisted somewhere to make it more performant
      const attrs = strapi.contentTypes[contentType].attributes
      const privateFields = Object.entries(attrs).map(([field, schema]) =>
        schema.private && !noSanitizePrivateFields.includes(field)
          ? field
          : false,
      )

      return entries.map(entry => {
        privateFields.forEach(attr => delete entry[attr])

        return entry
      })
    },

    /**
     * Remove unpublished entries from array of entries
     * unless `status` is set to 'draft'.
     *
     * @param {object} options
     * @param {Array<Object>} options.entries - The entries to filter.
     * @param {string} options.contentType - ContentType name.
     *
     * @return {Array<Object>} - Published entries.
     */
    removeUnpublishedArticles: function ({ entries, contentType }) {
      const collection = contentTypeService.getCollectionName({ contentType })
      const contentTypeConfig = meilisearchConfig[collection] || {}

      const entriesQuery = contentTypeConfig.entriesQuery || {}

      if (entriesQuery.status === 'draft') {
        return entries
      } else {
        return entries.filter(entry => !(entry?.publishedAt === null))
      }
    },

    /**
     * Remove language entries.
     * In the plugin entriesQuery, if `locale` is set and not equal to `all`
     * all entries that do not have the specified language are removed.
     *
     * @param {object} options
     * @param {Array<Object>} options.entries - The entries to filter.
     * @param {string} options.contentType - ContentType name.
     *
     * @return {Array<Object>} - Published entries.
     */
    removeLocaleEntries: function ({ entries, contentType }) {
      const collection = contentTypeService.getCollectionName({ contentType })
      const contentTypeConfig = meilisearchConfig[collection] || {}

      const entriesQuery = contentTypeConfig.entriesQuery || {}

      if (!entriesQuery.locale || entriesQuery.locale === 'all') {
        return entries
      } else {
        return entries.filter(entry => entry.locale === entriesQuery.locale)
      }
    },
  }
}
