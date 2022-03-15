'use strict'

module.exports = ({ store, strapi }) => ({
  /**
   * Get the API key of MeiliSearch from the store.
   *
   * @returns {Promise<string>} API key of Meilisearch instance.
   */
  getApiKey: async function () {
    return store.getStoreKey({ key: 'meilisearch_api_key' })
  },

  /**
   * Set the API key of MeiliSearch to the store.
   *
   * @param  {string} apiKey - API key of Meilisearch instance.
   */
  setApiKey: async function (apiKey) {
    return store.setStoreKey({
      key: 'meilisearch_api_key',
      value: apiKey || '',
    })
  },

  /**
   * Get host of MeiliSearch from the store.
   *
   * @returns {Promise<string>} Host of Meilisearch instance.
   */
  getHost: async function () {
    return store.getStoreKey({ key: 'meilisearch_host' })
  },

  /**
   * Set the host of MeiliSearch to the store.
   *
   * @param  {string} value
   */
  setHost: async function (value) {
    return store.setStoreKey({ key: 'meilisearch_host', value: value || '' })
  },

  /**
   * Add Clients credentials to the store
   *
   * @param  {Object} credentials
   * @param  {string} credentials.host - Host of the searchClient.
   * @param  {string} credentials.apiKey - ApiKey of the searchClient.
   *
   * @return {Promise<{
   *  host: string,
   *  apiKey: string,
   *  ApiKeyIsFromConfigFile: boolean,
   *  HostIsFromConfigFile: boolean
   * }>} Extended Credentials information
   */
  addCredentials: async function ({ host, apiKey }) {
    const {
      ApiKeyIsFromConfigFile,
      HostIsFromConfigFile,
    } = await this.getCredentials()

    if (!ApiKeyIsFromConfigFile) {
      await this.setApiKey(apiKey || '')
    }
    if (!HostIsFromConfigFile) {
      await this.setHost(host || '')
    }
    return this.getCredentials()
  },

  /**
   * Get credentials from the store and from the config file.
   *
   * @return {Promise<{
   *  host: string,
   *  apiKey: string,
   *  ApiKeyIsFromConfigFile: boolean,
   *  HostIsFromConfigFile: boolean
   * }>} Extended Credentials information
   */
  getCredentials: async function () {
    const apiKey = await this.getApiKey()
    const host = await this.getHost()

    const ApiKeyIsFromConfigFile =
      !!(await this.getApiKeyIsFromConfigFile()) || false
    const HostIsFromConfigFile =
      !!(await this.getHostIsFromConfigFile()) || false
    return { apiKey, host, ApiKeyIsFromConfigFile, HostIsFromConfigFile }
  },

  /**
   * Update clients credentials in the store
   *
   * @param  {Object} config - Credentials
   *
   * @return {Promise<{
   *  host: string,
   *  apiKey: string,
   *  ApiKeyIsFromConfigFile: boolean,
   *  HostIsFromConfigFile: boolean
   * }>} Extended Credentials information
   *
   */
  syncCredentials: async function (config) {
    let apiKey = ''
    let host = ''

    config = strapi.config.get('plugin.meilisearch')

    if (config && config) {
      apiKey = config.apiKey
      host = config.host
    }

    if (apiKey) {
      await this.setApiKey(apiKey)
    }
    const ApiKeyIsFromConfigFile = await this.setApiKeyIsFromConfigFile(
      !!apiKey
    )

    if (host) {
      await this.setHost(host)
    }
    const HostIsFromConfigFile = await this.setHostIsFromConfigFile(!!host)

    return { apiKey, host, ApiKeyIsFromConfigFile, HostIsFromConfigFile }
  },
  /**
   * True if the host is defined in the configuration file of the plugin.
   * False otherwise
   *
   * @returns  {Promise<boolean>} APIKeyCameFromConfigFile
   */
  getApiKeyIsFromConfigFile: async function () {
    return store.getStoreKey({ key: 'meilisearch_api_key_config' })
  },

  /**
   * Set to true if the API key is defined in the configuration file of the plugin.
   * False otherwise
   *
   * @param  {boolean} value - Whether the API key came from the configuration file
   *
   * @returns {Promise<boolean>} APIKeyCameFromConfigFile
   */
  setApiKeyIsFromConfigFile: async function (value) {
    return store.setStoreKey({ key: 'meilisearch_api_key_config', value })
  },

  /**
   * True if the host is defined in the configuration file of the plugin.
   * False otherwise
   *
   * @returns {Promise<boolean>} HostCameFromConfigFile
   */
  getHostIsFromConfigFile: async function () {
    return store.getStoreKey({ key: 'meilisearch_host_config' })
  },

  /**
   * Set to true if the host is defined in the configuration file of the plugin.
   * False otherwise
   *
   * @param  {string} value - Whether the host came from the configuration file
   *
   * @returns {Promise<boolean>} HostCameFromConfigFile
   */
  setHostIsFromConfigFile: async function (value) {
    return store.setStoreKey({ key: 'meilisearch_host_config', value })
  },
})
