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
      const { contentTypeName } = ctx.params;
      const contentTypeService = strapi.plugin('meilisearch').service('contentType')

      const uid = contentTypeService.getContentTypeUid({ contentType: contentTypeName })
      if (!uid) {
        ctx.body = await error.createError({
          name: 'ContentTypeNotFound',
          message: `ContentType ${contentTypeName} not found`,
        })
        return;
      }

      const contentType = strapi.contentTypes[uid]
      const fields = Object.entries(contentType.attributes).map(([key, attr]) => {
        return {
          name: key,
          type: attr.type,
          target: attr.target || null,
        }
      })
      ctx.body = { data: fields };
    },

    /**
     * Get the filterable attributes of a Meilisearch index.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async getFilterableAttributes(ctx) {
      const { indexUid } = ctx.params;

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
     * Update the filterable attributes of a Meilisearch index.
     *
     * @param  {object} ctx - Http request object.
     *
     */
    async updateFilterableAttributes(ctx) {
      const { indexUid } = ctx.params
      const { filterableAttributes, contentType } = ctx.request.body

      if (!Array.isArray(filterableAttributes)) {
        ctx.body = await error.createError({
          name: 'InvalidFilterableAttributes',
          message: 'filterableAttributes must be an array of strings',
        })
        return
      }

      const contentTypeService = strapi
        .plugin('meilisearch')
        .service('contentType')
      const uid = contentTypeService.getContentTypeUid({ contentType })
      if (!uid) {
        ctx.body = await error.createError({
          name: 'ContentTypeNotFound',
          message: `No content type found for "${contentType}"`,
        })
        return
      }

      const validFieldNames = Object.keys(strapi.contentType(uid).attributes)
      const invalidAttributes = filterableAttributes.filter(
        attr => !validFieldNames.includes(attr)
      )
      if (invalidAttributes.length > 0) {
        ctx.body = await error.createError({
          name: 'InvalidFilterableAttributes',
          message: `The following attributes do not exist in "${contentType}": ${invalidAttributes.join(', ')}`,
        })
        return
      }

      await meilisearch
        .updateFilterableAttributes({
          indexUid,
          filterableAttributes,
        })
        .then((taskUid) => {
          ctx.body = { data: taskUid }
        })
        .catch(async e => {
          ctx.body = await error.createError(e)
        })
    }
  }
}
