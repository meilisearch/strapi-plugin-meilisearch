const { isObject } = require('./utils')

/**
 * Validates the plugin configuration provided in `plugins/config.js` of the users plugin configuration.
 * Modifies the value of config on place.
 *
 * @param  {object} config - configurations
 */
function validateConfiguration(config) {
  if (config === undefined) {
    return
  }

  if (!isObject(config)) {
    strapi.log.error(
      'The `config` field in the Meilisearch plugin configuration must be of type object'
    )
    config = {}
  }
  const { host, apiKey, ...collections } = config

  // Validate the `host` parameter
  if ((host !== undefined && typeof host !== 'string') || config.host === '') {
    strapi.log.error(
      '`host` should be a non-empty string in Meilisearch configuration'
    )
    delete config.host
  }

  // Validate the `apikey` parameter
  if (apiKey !== undefined && typeof apiKey !== 'string') {
    strapi.log.error('`apiKey` should be a string in Meilisearch configuration')
    delete config.apiKey
  }

  for (const collection in collections) {
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
  ]

  if (configuration === undefined) {
    return
  }

  if (configuration !== undefined && !isObject(configuration)) {
    strapi.log.error(`The collection "${collection}" should be of type object`)
    return {}
  }

  const { indexName } = configuration
  if (
    (indexName !== undefined && typeof indexName !== 'string') ||
    indexName === ''
  ) {
    strapi.log.error(
      `the "indexName" param of "${collection}" should be a non-empty string`
    )
    delete configuration.indexName
  }
  if (
    configuration.transformEntry !== undefined &&
    typeof configuration.transformEntry !== 'function'
  ) {
    strapi.log.error(
      `the "transformEntry" param of "${collection}" should be a function`
    )
    delete configuration.transformEntry
  }

  if (
    configuration.filterEntry !== undefined &&
    typeof configuration.filterEntry !== 'function'
  ) {
    strapi.log.error(
      `the "filterEntry" param of "${collection}" should be a function`
    )
    delete configuration.filterEntry
  }

  if (
    configuration.settings !== undefined &&
    !isObject(configuration.settings)
  ) {
    strapi.log.error(
      `the "settings" param of "${collection}" should be an object`
    )
    delete configuration.settings
  }

  Object.keys(configuration).forEach(attribute => {
    if (!validApiFields.includes(attribute)) {
      strapi.log.warn(
        `The attribute "${attribute}" of "${collection}" is not a known parameter`
      )
      delete configuration[attribute]
    }
  })
  return configuration
}

module.exports = {
  validateConfiguration,
}
