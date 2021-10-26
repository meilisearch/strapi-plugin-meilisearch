'use strict'

/**
 * Connector factory to communicate between Strapi, the store, and MeiliSearch
 *
 * @param {Object} strapi - Strapi environment.
 * @param {Object} strapi.plugin - Plugins required services.
 * @param {Object} strapi.models - Strapi models.
 * @param {Object} strapi.services - Strapi services.
 * @param {Object} clients - Required clients.
 * @param {Object} clients.MeiliSearchClient - Constructor to create a MeiliSearch client.
 * @param {Object} clients.storeClient - Store instance.
 */
module.exports = async ({ storeClient }) => {
  return {
    /**
     * Get value of a given key from the store.
     *
     * @param  {string} key
     */
    getStoreKey: async function ({ key }) {
      return storeClient.get({ key })
    },

    /**
     * Set value of a given key to the store.
     *
     * @param  {string} key
     * @param  {any} value
     */
    setStoreKey: async function ({ key, value }) {
      return storeClient.set({ key, value })
    },

    /**
     * Get the api key of MeiliSearch from the store.
     *
     * @param  {string} key
     */
    getApiKey: async function () {
      return this.getStoreKey({ key: 'meilisearch_api_key' })
    },

    /**
     * Set the api key of MeiliSearch to the store.
     *
     * @param  {string} value
     */
    setApiKey: async function (value) {
      return this.setStoreKey({
        key: 'meilisearch_api_key',
        value: value || '',
      })
    },

    /**
     * Get host of MeiliSearch from the store.
     *
     * @param  {string} key
     */
    getHost: async function () {
      return this.getStoreKey({ key: 'meilisearch_host' })
    },

    /**
     * Set the host of MeiliSearch to the store.
     *
     * @param  {string} value
     */
    setHost: async function (value) {
      return this.setStoreKey({ key: 'meilisearch_host', value: value || '' })
    },

    /**
     * Get apiKey stored in the config file of a MeiliSearch from the store.
     *
     * @param  {string} key
     */
    getConfigApiKey: async function () {
      return this.getStoreKey({ key: 'meilisearch_api_key_config' })
    },

    /**
     * Set the api key from the config file of MeiliSearch to the store.
     *
     * @param  {string} value
     */
    setConfigApiKey: async function (value) {
      return this.setStoreKey({ key: 'meilisearch_api_key_config', value })
    },

    /**
     * Get host stored in the config file of a MeiliSearch from the store.
     *
     * @param  {string} key
     */
    getConfigHost: async function () {
      return this.getStoreKey({ key: 'meilisearch_host_config' })
    },

    /**
     * Set the host from the config file of MeiliSearch to the store.
     *
     * @param  {string} value
     */
    setConfigHost: async function (value) {
      return this.setStoreKey({ key: 'meilisearch_host_config', value })
    },

    /**
     * Get hooked collections from the store.
     *
     * @param  {string} key
     */
    getHookedCollections: async function () {
      return this.getStoreKey({ key: 'meilisearch_hooked' })
    },

    /**
     * Set hooked collections to the store.
     *
     * @param  {string} value
     */
    setHookedCollections: async function (value) {
      return this.setStoreKey({ key: 'meilisearch_hooked', value })
    },

    /**
     * Add Clients credentials to the store
     *
     * @param  {Object} credentials
     * @param  {string} credentials.host - Host of the searchClient.
     * @param  {string} credentials.apiKey - ApiKey of the searchClient.
     *
     * @return {{ host: string, apiKey: string}} - Credentials
     */
    addCredentials: async function ({ host, apiKey }) {
      const { configFileApiKey, configFileHost } = await this.getCredentials()

      if (!configFileApiKey) {
        await this.setApiKey(apiKey || '')
      }
      if (!configFileHost) {
        await this.setHost(host || '')
      }
      return this.getCredentials()
    },

    /**
     * Get credentials from the store and from the config file.
     *
     * @return {{ host: string, apiKey: string, configFileHost: string, configFileApiKey: string}}
     */
    getCredentials: async function () {
      const apiKey = await this.getApiKey()

      const host = await this.getHost()
      const configFileApiKey = (await this.getConfigApiKey()) || false
      const configFileHost = (await this.getConfigHost()) || false
      return { apiKey, host, configFileApiKey, configFileHost }
    },

    /**
     * Get watched collections from the store
     *
     * @returns {string[]} - Collection names.
     */
    getWatchedCollections: async function () {
      const collections = await this.getHookedCollections()
      return collections || []
    },

    /**
     * Create watched collections in the store
     *
     * @returns {[]}
     */
    createWatchedCollectionsStore: async function () {
      return this.setHookedCollections([])
    },

    /**
     * Add watched collections to the store.
     *
     * @param {string[]} - Collections names that watched.
     * @returns {string[]} - Collection names.
     */
    addWatchedCollectionToStore: async function (collections) {
      return this.setHookedCollections(collections || [])
    },

    /**
     * Update clients credentials in the store
     *
     * @param  {Object} config - Credentials
     */
    updateStoreCredentials: async function (config) {
      // optional chaining is not natively supported by node 12.
      let apiKey = false
      let host = false

      config = strapi.config.plugins
      if (config && config.meilisearch) {
        apiKey = config.meilisearch.apiKey
        host = config.meilisearch.host
      }

      if (apiKey) {
        await this.setApiKey(apiKey)
      }
      await this.setConfigApiKey(!!apiKey)

      if (host) {
        await this.setHost(host)
      }
      await this.setConfigHost(!!host)

      return { apiKey, host }
    },
  }
}
