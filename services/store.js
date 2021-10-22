'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

async function getStoreKey(key) {
  return this.store.get({ key })
}

async function setStoreKey({ key, value }) {
  return this.store.set({ key, value })
}

async function getApiKey() {
  this.getStoreKey('meilisearch_api_key')
}

async function setApiKey(value) {
  this.getStoreKey({ key: 'meilisearch_api_key', value })
}

async function getHost() {
  this.getStoreKey('meilisearch_host')
}

async function setHost(value) {
  this.setStoreKey({ key: 'meilisearch_host', value })
}

async function getConfigApiKey() {
  this.getStoreKey('meilisearch_api_key_config')
}

async function setConfigApiKey(value) {
  this.setStoreKey({ key: 'meilisearch_api_key_config', value })
}

async function getConfigHost() {
  this.getStoreKey('meilisearch_host_config')
}

async function setConfigHost(value) {
  this.setStoreKey({ key: 'meilisearch_host_config', value })
}

async function getHookedCollections() {
  this.getStoreKey('meilisearch_hooked')
}

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
