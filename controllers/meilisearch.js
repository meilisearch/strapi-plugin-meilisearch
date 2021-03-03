'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const credentialsService = () => strapi.plugins.meilisearch.services.credentials_store
const meiliSearchService = () => strapi.plugins.meilisearch.services.meilisearch

module.exports = {

  /**
   * Add documents and Update in MeiliSearch
   *
   * @return {Object}
   */
  addDocuments: async (ctx) => {
    const { indexUid } = ctx.params
    const { data } = ctx.request.body
    const { apiKey, host } = await credentialsService().getMeiliSearchCredentials()
    try {
      const updateId = await meiliSearchService().addDocuments({
        apiKey,
        host
      }, indexUid, data)
      ctx.send(updateId)
    } catch (e) {
      ctx.send({
        error: true,
        message: `${e.type}: \n${e.message || e.code}`,
        ...(e.errorLink ? { link: e.errorLink } : {})
      })
    }
  },
  getMeiliSearchCredentials: async (ctx) => {
    const { apiKey, host } = await credentialsService().getMeiliSearchCredentials()
    ctx.send({
      apiKey,
      host
    })
  },
  addMeiliSearchCredentials: async (ctx) => {
    const { host: msHost, apiKey: msApiKey } = ctx.request.body
    await credentialsService().setStoreKey({
      key: 'meilisearchApiKey',
      value: msApiKey
    })
    await credentialsService().setStoreKey({
      key: 'meilisearchHost',
      value: msHost
    })
    const { apiKey, host } = await credentialsService().getMeiliSearchCredentials()
    ctx.send({
      apiKey,
      host
    })
  }
}
