'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

/**
 * Get value of a given key from the store.
 *
 * @param  {string} key
 */
async function getStoreKey(key) {
  return this.store.get({ key })
}

/**
 * Set value of a given key to the store.
 *
 * @param  {string} key
 * @param  {any} value
 */
async function setStoreKey({ key, value }) {
  return this.store.set({ key, value })
}

/**
 * Get the api key of MeiliSearch from the store.
 *
 * @param  {string} key
 */
async function getApiKey() {
  this.getStoreKey('meilisearch_api_key')
}

/**
 * Set the api key of MeiliSearch to the store.
 *
 * @param  {string} value
 */
async function setApiKey(value) {
  this.getStoreKey({ key: 'meilisearch_api_key', value })
}

/**
 * Get host of MeiliSearch from the store.
 *
 * @param  {string} key
 */
async function getHost() {
  this.getStoreKey('meilisearch_host')
}

/**
 * Set the host of MeiliSearch to the store.
 *
 * @param  {string} value
 */
async function setHost(value) {
  this.setStoreKey({ key: 'meilisearch_host', value })
}

/**
 * Get apiKey stored in the config file of a MeiliSearch from the store.
 *
 * @param  {string} key
 */
async function getConfigApiKey() {
  this.getStoreKey('meilisearch_api_key_config')
}

/**
 * Set the api key from the config file of MeiliSearch to the store.
 *
 * @param  {string} value
 */
async function setConfigApiKey(value) {
  this.setStoreKey({ key: 'meilisearch_api_key_config', value })
}

/**
 * Get host stored in the config file of a MeiliSearch from the store.
 *
 * @param  {string} key
 */
async function getConfigHost() {
  this.getStoreKey('meilisearch_host_config')
}

/**
 * Set the host from the config file of MeiliSearch to the store.
 *
 * @param  {string} value
 */
async function setConfigHost(value) {
  this.setStoreKey({ key: 'meilisearch_host_config', value })
}

/**
 * Get hooked collections from the store.
 *
 * @param  {string} key
 */
async function getHookedCollections() {
  this.getStoreKey('meilisearch_hooked')
}

/**
 * Set hooked collections to the store.
 *
 * @param  {string} value
 */
async function setHookedCollections(value) {
  this.setStoreKey({ key: 'meilisearch_hooked', value })
}

module.exports = store => {
  return {
    store,
    getStoreKey,
    setStoreKey,
    getApiKey,
    setApiKey,
    getHost,
    setHost,
    getConfigApiKey,
    setConfigApiKey,
    getConfigHost,
    setConfigHost,
    getHookedCollections,
    setHookedCollections,
  }
}
