'use strict'

module.exports = ({ strapi }) => {
  const meilisearch = strapi.plugin('meilisearch').service('meilisearch')
  const error = strapi.plugin('meilisearch').service('error')

  return {
    /**
     * Get extended information about contentTypes.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async getContentTypes(ctx) {
      await meilisearch
        .getContentTypesReport()
        .then(contentTypes => {
          ctx.body = { data: contentTypes }
        })
        .catch(e => {
          ctx.body(error.createError(e))
        })
    },

    /**
     * Add a contentType to Meilisearch.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async addContentType(ctx) {
      const { contentType } = ctx.request.body

      await meilisearch
        .addContentTypeInMeiliSearch({
          contentType,
        })
        .then(taskUids => {
          ctx.body = { data: taskUids }
        })
        .catch(async e => {
          ctx.body = await error.createError(e)
        })
    },

    /**
     * Remove and re-index a contentType in Meilisearch.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async updateContentType(ctx) {
      const { contentType } = ctx.request.body
      await meilisearch
        .updateContentTypeInMeiliSearch({
          contentType,
        })
        .then(taskUids => {
          ctx.body = { data: taskUids }
        })
        .catch(async e => {
          ctx.body = await error.createError(e)
        })
    },

    /**
     * Remove or empty a contentType from Meilisearch
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async removeContentType(ctx) {
      const { contentType } = ctx.request.params

      await meilisearch
        .removeContentTypeFromMeiliSearch({
          contentType,
        })
        .then(() => {
          ctx.body = { data: 'ok' }
        })
        .catch(async e => {
          ctx.body = await error.createError(e)
        })
    },
  }
}
