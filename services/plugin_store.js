'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

module.exports = function pluginStore (name) {
  const store = strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: name
  })
  return {
    async getStoreKey (key) {
      return store.get({ key })
    },
    async setStoreKey (key) {
      return store.set(key)
    }
  }
}
