module.exports = ({ strapi }) => {
  // const store = strapi.plugin('meilisearch').service('store')
  const contentTypeService = strapi.plugin('meilisearch').service('contentType')
  const store = strapi.plugin('meilisearch').service('store')
  return {
    /**
     * Subscribe the content type to all required lifecycles
     *
     * @param  {object} options
     * @param  {string} options.contentType
     *
     * @returns {Promise<object>}
     */
    async subscribeContentType({ contentType }) {
      const contentTypeUid = contentTypeService.getContentTypeUid({
        contentType: contentType,
      })
      await strapi.db.lifecycles.subscribe({
        models: [contentTypeUid],
        afterCreate(event) {
          const { result } = event
          const meilisearch = strapi
            .plugin('meilisearch')
            .service('meilisearch')

          meilisearch
            .addEntriesInMeilisearch({
              contentType: contentTypeUid,
              entries: result,
            })
            .catch(e => {
              strapi.log.error(
                `Meilisearch could not add entry with id: ${result.id}: ${e.message}`
              )
            })
        },
        afterCreateMany() {
          strapi.log.error(
            `Meilisearch does not work with \`afterCreateMany\` hook as the entries are provided without their id`
          )
        },
        afterUpdate(event) {
          const { result } = event
          const meilisearch = strapi
            .plugin('meilisearch')
            .service('meilisearch')

          meilisearch
            .updateEntriesInMeilisearch({
              contentType: contentTypeUid,
              entries: [result],
            })
            .catch(e => {
              strapi.log.error(
                `Meilisearch could not update entry with id: ${result.id}: ${e.message}`
              )
            })
        },
        afterUpdateMany() {
          strapi.log.error(
            `Meilisearch could not find an example on how to access the \`afterUpdateMany\` hook. Please consider making an issue to explain your use case`
          )
        },
        afterDelete(event) {
          const { result, params } = event
          const meilisearch = strapi
            .plugin('meilisearch')
            .service('meilisearch')

          let entriesId = []
          // Different ways of accessing the id's depending on the number of entries being deleted
          // In case of multiple deletes:
          if (
            params?.where?.$and &&
            params?.where?.$and[0] &&
            params?.where?.$and[0].id?.$in
          )
            entriesId = params?.where?.$and[0].id.$in
          // In case there is only one entry being deleted
          else entriesId = [result.id]

          meilisearch
            .deleteEntriesFromMeiliSearch({
              contentType: contentTypeUid,
              entriesId: entriesId,
            })
            .catch(e => {
              strapi.log.error(
                `Meilisearch could not delete entry with id: ${result.id}: ${e.message}`
              )
            })
        },
        afterDeleteMany() {
          strapi.log.error(
            `Meilisearch could not find an example on how to access the \`afterDeleteMany\` hook. Please consider making an issue to explain your use case`
          )
        },
      })

      return store.addListenedContentType({
        contentType: contentTypeUid,
      })
    },
  }
}
