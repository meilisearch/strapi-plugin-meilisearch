'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

async function getStoreKey (key) {
  this.store().delete('meilisearchApiKey')
  this.store().delete('meilisearchHost')
  return this.store().get({ key })
}

async function setStoreKey (key) {
  return this.store().set(key)
}

function store () {
  return strapi.plugins.meilisearch.store
}

module.exports = {
  store,
  getStoreKey,
  setStoreKey
}
