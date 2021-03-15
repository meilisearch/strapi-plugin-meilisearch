'use strict'

const fs = require('fs')
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const meilisearch = {
  http: () => strapi.plugins.meilisearch.services.meilisearch_http,
  client: (credentials) => strapi.plugins.meilisearch.services.meilisearch_client(credentials),
  store: () => strapi.plugins.meilisearch.services.plugin_store('meilisearchCredentials')
}

module.exports = {
  lifecycles: {
    async beforeFindOne (params, data) {
      // const apiKey = await meilisearch.store().getStoreKey('meilisearchApiKey')
      // const host = await meilisearch.store().getStoreKey('meilisearchHost')
      console.log({ apiKey, host })
    },
    async beforeFind (params, data) {
      console.log({ params, data })
      console.log(strapi.plugins.meilisearch.services.meilisearch)
    },
    async beforeSearch (params, data) {
      console.log({ params, data })
      console.log(strapi.plugins.meilisearch.services.meilisearch)
    }
  }

}
