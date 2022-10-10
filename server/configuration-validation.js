const { isObject } = require('./utils')

function CollectionConfig(collectionName, configuration) {
  const log = strapi.log // has to be inside a scope
  const {
    indexName,
    transformEntry,
    filterEntry,
    settings,
    populateEntryRule,
    ...excedent
  } = configuration
  const options = {}

  return {
    validateIndexName() {
      // indexName is either undefined or a none empty string
      if (
        (indexName !== undefined && typeof indexName !== 'string') ||
        indexName === ''
      ) {
        log.error(
          `The "indexName" option of "${collectionName}" should be a non-empty string`
        )
      } else if (indexName !== undefined) {
        options.indexName = indexName
      }

      return this
    },

    validateTransformEntry() {
      // transformEntry is either undefined or a function
      if (
        transformEntry !== undefined &&
        typeof transformEntry !== 'function'
      ) {
        log.error(
          `The "transformEntry" option of "${collectionName}" should be a function`
        )
      } else if (transformEntry !== undefined) {
        options.transformEntry = transformEntry
      }

      return this
    },

    validateFilterEntry() {
      // filterEntry is either undefined or a function
      if (filterEntry !== undefined && typeof filterEntry !== 'function') {
        log.error(
          `The "filterEntry" option of "${collectionName}" should be a function`
        )
      } else if (filterEntry !== undefined) {
        options.filterEntry = filterEntry
      }

      return this
    },

    validateMeilisearchSettings() {
      // Settings is either undefined or an object
      if (settings !== undefined && !isObject(settings)) {
        log.error(
          `The "settings" option of "${collectionName}" should be an object`
        )
      } else if (settings !== undefined) {
        options.settings = settings
      }

      return this
    },

    validatePopulateEntryRule() {
      // PopulateEntry is either undefined or an object/array/string
      if (
        populateEntryRule !== undefined &&
        !isObject(populateEntryRule) &&
        !Array.isArray(populateEntryRule) &&
        typeof populateEntryRule !== 'string'
      ) {
        log.error(
          `The "populateEntryRule" option of "${collectionName}" should be an object/array/string`
        )
      } else if (populateEntryRule !== undefined) {
        options.populateEntryRule = populateEntryRule
      }

      return this
    },

    validateNoInvalidKeys() {
      // Keys that should not be present in the configuration
      Object.keys(excedent).map(key => {
        log.warn(
          `The "${key}" option of "${collectionName}" is not a known option`
        )
      })

      return this
    },
    get() {
      return options
    },
  }
}

function PluginConfig(configuration) {
  const log = strapi.log // has to be inside a scope
  const { apiKey, host, ...collections } = configuration
  const options = {}

  return {
    validateApiKey() {
      // apiKey is either undefined or a string
      if (apiKey !== undefined && typeof apiKey !== 'string') {
        log.error('The "apiKey" option should be a string')
      } else if (apiKey !== undefined) {
        options.apiKey = apiKey
      }
      return this
    },

    validateHost() {
      // // apiKey is either undefined or a none empty string
      if ((host !== undefined && typeof host !== 'string') || host === '') {
        log.error('The "host" option should be a non-empty string')
      } else if (host !== undefined) {
        options.host = host
      }
      return this
    },

    validateCollections() {
      // Itterate over all collections to validate their configuration
      for (const collection in collections) {
        if (!isObject(collections[collection])) {
          log.error(
            `The collection "${collection}" configuration should be of type object`
          )
          options[collection] = {}
        } else {
          options[collection] = CollectionConfig(
            collection,
            collections[collection]
          )
            .validateIndexName()
            .validateFilterEntry()
            .validateTransformEntry()
            .validateMeilisearchSettings()
            .validatePopulateEntryRule()
            .validateNoInvalidKeys()
            .get()
        }
      }
      return this
    },

    get() {
      return options
    },
  }
}

/**
 * Validates the plugin configuration provided in `plugins/config.js` of the users plugin configuration.
 * Modifies the value of config on place.
 *
 * @param  {object} config - The plugin configuration
 */
function validatePluginConfig(config) {
  const log = strapi.log

  // If no configuration, return
  if (config === undefined) {
    return
  } else if (config !== undefined && !isObject(config)) {
    log.error(
      'The "config" field in the Meilisearch plugin configuration should be an object'
    )
    return
  }

  const options = PluginConfig(config)
    .validateApiKey()
    .validateHost()
    .validateCollections()
    .get()

  Object.assign(config, options)
}

module.exports = {
  validatePluginConfig,
}
