const { isObject } = require('../utils')

/**
 * Validates the plugin configuration provided in `plugins/config.js` of the users plugin configuration.
 * Modifies the value of config on place.
 *
 * @param  {object} config - configurations
 */
function validateConfiguration(config) {
  const validPluginField = ['host', 'apiKey']

  if (config === undefined) {
    return
  }

  if (!isObject(config)) {
    strapi.log.error(
      'The `config` field in the MeiliSearch plugin configuration must be of type object'
    )
    config = {}
  }

  // Validate the attributes
  Object.keys(config).forEach(attribute => {
    if (!validPluginField.includes(attribute)) {
      strapi.log.warn(
        `The field "${attribute}" in the MeiliSearch plugin config is not a valid parameter`
      )
      delete config[attribute]
    }
  })

  // Validate the `host` parameter
  if (
    (config.host !== undefined && typeof config.host !== 'string') ||
    config.host === ''
  ) {
    strapi.log.error(
      '`host` should be a non-empty string in MeiliSearch configuration'
    )
    delete config.host
  }

  // Validate the `apikey` parameter
  if (config.apiKey !== undefined && typeof config.apiKey !== 'string') {
    strapi.log.error('`apiKey` should be a string in MeiliSearch configuration')
    delete config.apiKey
  }
}

function validateApiConfigs({ strapi }) {
  const apis = strapi
    .plugin('meilisearch')
    .service('contentTypes')
    .getApisName()

  for (const apiName of apis) {
    validateApiConfig({ strapi, apiName })
  }
}

function validateApiConfig({ strapi, apiName }) {
  const validApiFields = ['indexName', 'transformEntry', 'settings']

  const configuration = strapi
    .plugin('meilisearch')
    .service('contentTypes')
    .getAPIConfig({ apiName }).meilisearch

  if (configuration === undefined) {
    return
  }

  if (configuration !== undefined && !isObject(configuration)) {
    strapi.log.error(
      `The "meilisearch" configuration in the ${apiName} service should be of type object`
    )
    strapi.api[apiName].services[apiName] = {}
    return
  }

  if (
    (configuration.indexName !== undefined &&
      typeof configuration.indexName !== 'string') ||
    configuration.indexName === ''
  ) {
    strapi.log.error(
      `the "indexName" param in the "${apiName}" service should be a non-empty string`
    )
    delete configuration.indexName
  }
  if (
    configuration.transformEntry !== undefined &&
    typeof configuration.transformEntry !== 'function'
  ) {
    strapi.log.error(
      `the "transformEntry" param in the "${apiName}" service should be should be a function`
    )
    delete configuration.transformEntry
  }

  if (
    configuration.settings !== undefined &&
    !isObject(configuration.settings)
  ) {
    strapi.log.error(
      `the "settings" param in the "${apiName}" service should be an object`
    )
    delete configuration.settings
  }

  Object.keys(configuration).forEach(attribute => {
    if (!validApiFields.includes(attribute)) {
      strapi.log.warn(
        `${attribute} in the "${apiName}" service is not a valid parameter`
      )
      delete configuration[attribute]
    }
  })
  return configuration
}

module.exports = {
  validateConfiguration,
  validateApiConfigs,
  validateApiConfig,
}
