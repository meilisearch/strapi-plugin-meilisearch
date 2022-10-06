const { isObject } = require('./utils')

/**
 * Validates the plugin configuration provided in `plugins/config.js` of the users plugin configuration.
 * Modifies the value of config on place.
 *
 * @param  {object} config - configurations
 */
function validateConfiguration(config) {
  // If no configuration, return
  if (config === undefined) {
    return
  }

  // Configuration must be an object
  if (!isObject(config)) {
    strapi.log.error(
      'The `config` field in the Meilisearch plugin configuration must be of type object'
    )
    config = {}
  }

  const { host, apiKey, ...collections } = config

  // Validate the `host` option
  if ((host !== undefined && typeof host !== 'string') || config.host === '') {
    strapi.log.error(
      '`host` should be a non-empty string in Meilisearch configuration'
    )
    delete config.host
  }

  // Validate the `apikey` option
  if (apiKey !== undefined && typeof apiKey !== 'string') {
    strapi.log.error('`apiKey` should be a string in Meilisearch configuration')
    delete config.apiKey
  }

  // Validate the `collections` option
  for (const collection in collections) {
    // Validate the configuration for each collection
    config[collection] = validateCollectionConfiguration({
      configuration: collections[collection],
      collection: collection,
    })
  }
}

function validateCollectionConfiguration({ configuration, collection }) {
  const validApiFields = [
    'indexName',
    'transformEntry',
    'settings',
    'filterEntry',
    'populateEntryRule',
    'dbQueryOptions',
  ]

  // if the collection has no configuration, return
  if (configuration === undefined) {
    return
  }

  // Validate the configuration type of the collection
  if (configuration !== undefined && !isObject(configuration)) {
    strapi.log.error(`The collection "${collection}" should be of type object`)
    return {}
  }

  const {
    indexName,
    transformEntry,
    filterEntry,
    dbQueryOptions,
    populateEntryRule,
    settings,
  } = configuration

  // Validate the `indexName` option
  if (
    (indexName !== undefined && typeof indexName !== 'string') ||
    indexName === ''
  ) {
    strapi.log.error(
      `the "indexName" option of "${collection}" should be a non-empty string`
    )
    delete configuration.indexName
  }

  // Validate the `transformEntry` option
  if (transformEntry !== undefined && typeof transformEntry !== 'function') {
    strapi.log.error(
      `the "transformEntry" option of "${collection}" should be a function`
    )
    delete configuration.transformEntry
  }

  // Validate the `filterEntry` option
  if (filterEntry !== undefined && typeof filterEntry !== 'function') {
    strapi.log.error(
      `the "filterEntry" option of "${collection}" should be a function`
    )
    delete configuration.filterEntry
  }

  // Validate the `settings` option
  if (settings !== undefined && !isObject(settings)) {
    strapi.log.error(
      `the "settings" option of "${collection}" should be an object`
    )
    delete configuration.settings
  }

  console.log(configuration.dbQueryOptions)

  // Validate the `dbQueryOptions` option
  if (
    configuration.dbQueryOptions !== undefined &&
    !isObject(configuration.dbQueryOptions)
  ) {
    strapi.log.error(
      `the "dbQueryOptions" option of "${collection}" should be an object`
    )
    delete configuration.dbQueryOptions
  }

  // Validate the `populateEntryRule` option
  if (
    populateEntryRule !== undefined &&
    !isObject(populateEntryRule) &&
    !Array.isArray(populateEntryRule) &&
    typeof populateEntryRule !== 'string'
  ) {
    strapi.log.error(
      `the "populateEntryRule" option of "${collection}" should be an object/array/string`
    )
    delete configuration.populateEntryRule
  }

  // Ensure that there are no additional unknown keys
  Object.keys(configuration).forEach(attribute => {
    if (!validApiFields.includes(attribute)) {
      strapi.log.warn(
        `The attribute "${attribute}" of "${collection}" is not a known option`
      )
      delete configuration[attribute]
    }
  })
  return configuration
}

module.exports = {
  validateConfiguration,
}
