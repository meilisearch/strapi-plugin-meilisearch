'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

async function getStoreKey(key) {
  return this.store().get({ key })
}

async function setStoreKey(key) {
  return this.store().set(key)
}

function store() {
  return strapi.plugins.meilisearch.store
}

function getConfigKey(key) {
  return this.config()[key]
}

function config() {
  return strapi.plugins.meilisearch.config
}

module.exports = {
  store,
  config,
  getStoreKey,
  setStoreKey,
  getConfigKey,
}
