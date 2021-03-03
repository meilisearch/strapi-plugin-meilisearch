'use strict'

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const pluginStore = () => strapi.store({
  environment: strapi.config.environment,
  type: 'plugin',
  name: 'meilisearchCredentials'
})

module.exports = {
  async getMeiliSearchCredentials () {
    const apiKey = await pluginStore().get({ key: 'meilisearchApiKey' })
    const host = await pluginStore().get({ key: 'meilisearchHost' })
    return {
      apiKey,
      host
    }
  },
  async getStoreKey (key) {
    return pluginStore().get({ key })
  },
  async setStoreKey (key) {
    return pluginStore().set(key)
  }
}
