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

module.exports = store => {
  return {
    store,
    getStoreKey,
    setStoreKey,
  }
}
