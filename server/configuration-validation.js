const { isObject } = require('./utils')

function CollectionOptions(name, configuration) {
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
    validateConfiguration() {
      // Configuration is either undefined or an object
      if (configuration !== undefined && !isObject(configuration)) {
        log.error(`The collection "${name}" should be of type object`)
      }

      return this
    },
    validateIndexName() {
      // indexName is either undefined or a none empty string
      if (
        (indexName !== undefined && typeof indexName !== 'string') ||
        indexName === ''
      ) {
        log.error(
          `the "indexName" option of "${name}" should be a non-empty string`
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
          `the "transformEntry" option of "${name}" should be a function`
        )
      } else if (transformEntry !== undefined) {
        options.transformEntry = transformEntry
      }

      return this
    },
    validateFilterEntry() {
      // filterEntry is either undefined or a function
      if (filterEntry !== undefined && typeof filterEntry !== 'function') {
        log.error(`the "filterEntry" option of "${name}" should be a function`)
      } else if (filterEntry !== undefined) {
        options.filterEntry = filterEntry
      }

      return this
    },
    validateMeilisearchSettings() {
      // Settings is either undefined or an object
      if (settings !== undefined && !isObject(settings)) {
        log.error(`the "settings" option of "${name}" should be an object`)
      } else if (settings !== undefined) {
        options.settings = settings
      }

      return this
    },
    validatePopulateEntryRule() {
      // PopulateEntry is either undefined or an object/array/string`
      if (
        populateEntryRule !== undefined &&
        !isObject(populateEntryRule) &&
        !Array.isArray(populateEntryRule) &&
        typeof populateEntryRule !== 'string'
      ) {
        log.error(
          `the "populateEntryRule" option of "${name}" should be an object/array/string`
        )
      } else if (populateEntryRule !== undefined) {
        options.populateEntryRule = populateEntryRule
      }

      return this
    },
    validateNoInvalidKeys() {
      // Keys that should not be present in the configuration
      Object.keys(excedent).map(key => {
        log.warn(`The attribute "${key}" of "${name}" is not a known option`)
      })

      return this
    },
    get() {
      return options
    },
  }
}

function PluginOptions(configuration) {
  const log = strapi.log // has to be inside a scope
  const { apiKey, host, ...collections } = configuration
  const options = {}

  return {
    validateConfiguration() {
      // Configuration must be an object
      if (!isObject(configuration)) {
        log.error(
          'The `config` field in the Meilisearch plugin configuration must be of type object'
        )
      }

      return this
    },

    validateApiKey() {
      // apiKey is either undefined or a string
      if (apiKey !== undefined && typeof apiKey !== 'string') {
        log.error(
          '`apiKey` should be a string in Meilisearch plugin configuration'
        )
      } else if (apiKey !== undefined) {
        options.apiKey = apiKey
      }
      return this
    },

    validateHost() {
      // // apiKey is either undefined or a none empty string
      if ((host !== undefined && typeof host !== 'string') || host === '') {
        log.error(
          '`host` should be a non-empty string in Meilisearch plugin configuration'
        )
      } else if (host !== undefined) {
        options.host = host
      }
      return this
    },

    validateCollectionConfigurations() {
      // Itterate over all collections to validate their configuration
      for (const collection in collections) {
        options[collection] = CollectionOptions(
          collection,
          collections[collection]
        )
          .validateConfiguration()
          .validateIndexName()
          .validateFilterEntry()
          .validateTransformEntry()
          .validateMeilisearchSettings()
          .validatePopulateEntryRule()
          .validateNoInvalidKeys()
          .get()
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
 * @param  {object} config - configurations
 */
function validateConfiguration(configuration) {
  // If no configuration, return
  if (configuration === undefined) {
    return
  }

  const options = PluginOptions(configuration)
    .validateConfiguration()
    .validateApiKey()
    .validateHost()
    .validateCollectionConfigurations()
    .get()

  Object.assign(configuration, options)
}

module.exports = {
  validateConfiguration,
}
