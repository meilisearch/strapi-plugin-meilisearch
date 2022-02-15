'use strict'
const { isObject } = require('../../../utils')

module.exports = ({ strapi }) => {
  return {
    /**
     * Get the name of the index in which the collection content is added.
     *
     * The apiName is the name of the API to access information about a specific collection
     * it is in `name` format and not `api::name.name`
     *
     * @param apiName - Name of the api.
     *
     * @return {String} - Index name
     */
    getIndexName: function ({ apiName }) {
      const config = strapi?.api[apiName]?.services[apiName]?.meilisearch || {}

      const indexName = config.indexName || apiName
      return indexName
    },

    /**
     * Transform collections entries before indexation in MeiliSearch.
     *
     * @param {string} apiName - apiName name.
     * @param {Array<Object>} data  - The data to convert. Conversion will use
     * the static method `toSearchIndex` defined in the model definition
     *
     * @return {Array<Object>} - Converted or mapped data
     */
    transformEntries: function ({ apiName, entries = [] }) {
      const conf = strapi?.api[apiName]?.services[apiName]?.meilisearch || {}

      const aborted = () => {
        strapi.log.error(
          'Indexing of ${apiName} aborted as the data could not be transformed'
        )
        return [] // return empty array to avoid indexing entries that might contain sensitive data
      }

      try {
        if (
          Array.isArray(entries) &&
          typeof conf?.transformEntry === 'function'
        ) {
          const transformed = entries.map(entry =>
            conf.transformEntry({
              entry,
              apiName,
            })
          )

          if (transformed.length > 0 && !isObject(transformed[0])) {
            return aborted()
          }
          return transformed
        }
      } catch (e) {
        strapi.log.error(e)
        return aborted()
      }

      return entries
    },

    /**
     * Returns MeiliSearch index settings from model definition.
     * @param apiName - Name of the apiName.
     * @typedef Settings
     * @type {import('meilisearch').Settings}
     * @return {Settings} - MeiliSearch index settings
     */
    getSettings: function ({ apiName }) {
      const config = strapi?.api[apiName]?.services[apiName]?.meilisearch || {}

      const settings = config.settings || {}
      return settings
    },

    getAllAPIConfiguration: function () {
      const apis = strapi
        .plugin('meilisearch')
        .service('contentTypes')
        .getApisName()

      return apis.map(apiName => {
        return strapi.api[apiName]?.services || {}
      })
    },

    getAPIConfig: function ({ apiName }) {
      return strapi.api[apiName]?.services[apiName] || {}
    },

    changeConfigurations: function ({ configuration, apiName }) {
      return (strapi.api[apiName].services[apiName] = configuration)
    },
  }
}
