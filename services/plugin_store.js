'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

async function getStoreKey (key) {
  return this.store.get({ key })
}

async function setStoreKey (key) {
  return this.store.set(key)
}

module.exports = async function pluginStore (name) {
  const store = strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: name
  })
  const apiKey = await store.get({ key: 'meilisearchApiKey' })
  const host = await store.get({ key: 'meilisearchHost' })
  const config = { apiKey, host }
  return {
    store,
    apiKey,
    host,
    config,
    getStoreKey,
    setStoreKey
  }
}
