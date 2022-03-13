'use strict'

module.exports = ({ strapi }) => {
  const meilisearch = strapi.plugin('meilisearch').service('meilisearch')
  return {
    /**
     * Get extended information about contentTypes.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async getContentTypes(ctx) {
      const contentTypes = await meilisearch.getContentTypesReport()

      ctx.body = { data: contentTypes }
    },

    /**
     * Add a contentType to Meilisearch.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async addContentType(ctx) {
      const { contentType } = ctx.request.body

      const contentTypes = await meilisearch.updateContentTypeInMeiliSearch({
        contentType,
      })
      ctx.body = { data: contentTypes }
    },

    /**
     * Remove and re-index a contentType in Meilisearch.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async updateContentType(ctx) {
      const { contentType } = ctx.request.body
      const updateContentType = await meilisearch.updateContentTypeInMeiliSearch(
        {
          contentType,
        }
      )
      ctx.body = { data: updateContentType }
    },

    /**
     * Remove or empty a contentType from Meilisearch
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async removeContentType(ctx) {
      const { contentType } = ctx.request.params

      await meilisearch.removeContentTypeFromMeiliSearch({
        contentType,
      })
      ctx.body = { data: 'ok' }
    },
  }
}
