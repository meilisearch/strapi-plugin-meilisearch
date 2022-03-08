'use strict'

module.exports = ({ strapi }) => {
  const store = strapi.plugin('meilisearch').service('store')
  const meilisearch = strapi.plugin('meilisearch').service('meilisearch')
  return {
    /**
     * Get extended information about collections/content-types.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async getCollections(ctx) {
      const collections = await meilisearch.getCollectionsReport()
      ctx.body = { data: collections }
    },

    /**
     * Add a collection to Meilisearch.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async addCollection(ctx) {
      const { collection } = ctx.request.body
      const collections = await store.updateCollectionInMeiliSearch({
        collection,
      })
      ctx.body = { data: collections }
    },

    /**
     * Remove and re-index a collection in Meilisearch.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async updateCollection(ctx) {
      const { collection } = ctx.request.body
      const updateCollection = await store.updateCollectionInMeiliSearch({
        collection,
      })
      ctx.body = { data: updateCollection }
    },

    /**
     * Remove or empty a collection from Meilisearch
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async removeCollection(ctx) {
      const { collection } = ctx.request.body
      await store.removeCollectionFromMeiliSearch({
        collection,
      })
      ctx.body = { data: 'ok' }
    },
  }
}
