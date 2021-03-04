'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const pluginStore = () => strapi.store({
  environment: strapi.config.environment,
  type: 'plugin',
  name: 'meilisearchCollections'
})

module.exports = {
  async getMeiliSearchCredentials () {
    return pluginStore().get({ key: 'indexedCollections' })
  },
  async getStoreKey (key) {
    return pluginStore().get({ key })
  },
  async setStoreKey (key) {
    return pluginStore().set(key)
  }
}
