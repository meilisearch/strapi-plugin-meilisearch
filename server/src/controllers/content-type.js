export default ({ strapi }) => {
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
        .catch(async e => {
          ctx.body = await error.createError(e)
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
        .emptyOrDeleteIndex({
          contentType,
        })
        .then(() => {
          ctx.body = { data: 'ok' }
        })
        .catch(async e => {
          ctx.body = await error.createError(e)
        })
    },

    /**
     * Get the fields of a contentType.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async getContentTypeFields(ctx) {
      const { contentTypeName } = ctx.params
      const contentTypeService = strapi
        .plugin('meilisearch')
        .service('contentType')

      const uid = contentTypeService.getContentTypeUid({
        contentType: contentTypeName,
      })
      if (!uid) {
        const err = new Error(`ContentType ${contentTypeName} not found`)
        err.name = 'ContentTypeNotFound'
        ctx.body = await error.createError(err)
        return
      }

      const contentType = strapi.contentTypes[uid]
      const fields = Object.entries(contentType.attributes).map(
        ([key, attr]) => {
          return {
            name: key,
            type: attr.type,
            target: attr.target || null,
          }
        },
      )
      ctx.body = { data: fields }
    },

    /**
     * Get the filterable attributes currently configured on a Meilisearch index.
     *
     * Responds with an array of strings, each string being the name of a filterable attribute.
     *
     * @param {object} ctx - Http request object.
     * @param {object} ctx.params
     * @param {string} ctx.params.indexUid - UID of the Meilisearch index to read.
     * @returns {Promise<void>} Resolves once `ctx.body` has been assigned.
     *
     */
    async getFilterableAttributes(ctx) {
      const { indexUid } = ctx.params

      await meilisearch
        .getFilterableAttributes({ indexUid })
        .then(attributes => {
          ctx.body = { data: attributes }
        })
        .catch(async e => {
          ctx.body = await error.createError(e)
        })
    },

    /**
     * Replace the filterable attributes of a Meilisearch index.
     *
     * Replaces the existing filterable attributes with the provided list. Validates that the provided attributes exist on the related content-type.
     * On success, responds with the task UID of the Meilisearch update operation and the update is enqueued in Meilisearch.
     *
     * @param {object} ctx - Http request object.
     * @param {object} ctx.params
     * @param {string} ctx.params.indexUid - UID of the Meilisearch index to update.
     * @param {object} ctx.request.body
     * @param {string[]} ctx.request.body.filterableAttributes - Attribute names to make filterable.
     * @param {string} ctx.request.body.contentType - UID of the related content-type, used for validation.
     * @returns {Promise<void>} Resolves once `ctx.body` has been assigned.
     *
     */
    async updateFilterableAttributes(ctx) {
      const { indexUid } = ctx.params
      const { filterableAttributes, contentType } = ctx.request.body

      if (!Array.isArray(filterableAttributes)) {
        const err = new Error(
          'filterableAttributes must be an array of strings',
        )
        err.name = 'InvalidFilterableAttributes'
        ctx.body = await error.createError(err)
        return
      }

      const contentTypeService = strapi
        .plugin('meilisearch')
        .service('contentType')
      const uid = contentTypeService.getContentTypeUid({ contentType })
      if (!uid) {
        const err = new Error(`No content type found for "${contentType}"`)
        err.name = 'ContentTypeNotFound'
        ctx.body = await error.createError(err)
        return
      }

      const validFieldNames = Object.keys(strapi.contentType(uid).attributes)
      const invalidAttributes = filterableAttributes.filter(
        attr => !validFieldNames.includes(attr),
      )
      if (invalidAttributes.length > 0) {
        const err = new Error(
          `The following attributes do not exist in "${contentType}": ${invalidAttributes.join(', ')}`,
        )
        err.name = 'InvalidFilterableAttributes'
        ctx.body = await error.createError(err)
        return
      }

      await meilisearch
        .updateFilterableAttributes({
          indexUid,
          filterableAttributes,
        })
        .then(taskUid => {
          ctx.body = { data: taskUid }
        })
        .catch(async e => {
          ctx.body = await error.createError(e)
        })
    },
  }
}
