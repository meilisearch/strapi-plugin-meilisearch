'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */


module.exports = {

  /**
   * Default action.
   *
   * @return {Object}
   */
  index: async (ctx) => {
    // Add your own logic here.
    // Send 200 `ok`
    ctx.send({
      message: 'ok'
    })
  },

  /**
   * Get Or Create Index in MeilISearch
   *
   * @return {Object}
   */
  getOrCreateIndex: async (ctx) => {
    const meiliSearchService = strapi.plugins['meilisearch'].services.meilisearch
    console.log(meiliSearchService)
    console.log(ctx.request.body)
    const { uid } = ctx.request.body
    const index = await meiliSearchService.getOrCreateIndex(uid)
    ctx.send(index);
  },

  /**
   * Delete Index in MeilISearch
   *
   * @return {Object}
   */
  deleteIndex: async (ctx) => {
    const meiliSearchService = strapi.plugins['meilisearch'].services.meilisearch
    const { indexUid } = ctx.params
    await meiliSearchService.deleteIndex(indexUid)
    ctx.send({ removed: true })
  },

  /**
   * Add documents and Update in MeiliSearch
   *
   * @return {Object}
   */
  addDocuments: async (ctx) => {
    const meiliSearchService = strapi.plugins['meilisearch'].services.meilisearch
    const { indexUid } = ctx.params
    const { data } = ctx.request.body
    const updateId = await meiliSearchService.addDocuments(indexUid, data)
    ctx.send(updateId)
  },

  /**
   * Delete Documents in MeiliSearch
   *
   * @return {Object}
   */
  deleteDocuments: async (ctx) => {
    const meiliSearchService = strapi.plugins['meilisearch'].services.meilisearch
    const { indexUid } = ctx.params
    const { data } = ctx.request.body
    await meiliSearchService.addDocuments(indexUid, data)
    ctx.send({ message: "ok" })
  }

}
