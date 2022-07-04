module.exports = ({ strapi, contentType }) => {
  const contentTypeService = strapi.plugin('meilisearch').service('contentType')
  const contentTypeUid = contentTypeService.getContentTypeUid({
    contentType: contentType,
  })

  return {
    async afterCreate(event) {
      const { result } = event
      const meilisearch = strapi.plugin('meilisearch').service('meilisearch')

      // Fetch complete entry instead of using result that is possibly
      // partial.
      const entry = await contentTypeService.getEntry({
        contentType: contentTypeUid,
        id: result.id,
        populate: meilisearch.populateEntryRule({ contentType }),
      })

      meilisearch
        .addEntriesToMeilisearch({
          contentType: contentTypeUid,
          entries: [entry],
        })
        .catch(e => {
          strapi.log.error(
            `Meilisearch could not add entry with id: ${result.id}: ${e.message}`
          )
        })
    },
    async afterCreateMany() {
      strapi.log.error(
        `Meilisearch does not work with \`afterCreateMany\` hook as the entries are provided without their id`
      )
    },
    async afterUpdate(event) {
      const { result } = event
      const meilisearch = strapi.plugin('meilisearch').service('meilisearch')

      // Fetch complete entry instead of using result that is possibly
      // partial.
      const entry = await contentTypeService.getEntry({
        contentType: contentTypeUid,
        id: result.id,
        populate: meilisearch.populateEntryRule({ contentType }),
      })

      meilisearch
        .updateEntriesInMeilisearch({
          contentType: contentTypeUid,
          entries: [entry],
        })
        .catch(e => {
          strapi.log.error(
            `Meilisearch could not update entry with id: ${result.id}: ${e.message}`
          )
        })
    },
    async afterUpdateMany() {
      strapi.log.error(
        `Meilisearch could not find an example on how to access the \`afterUpdateMany\` hook. Please consider making an issue to explain your use case`
      )
    },
    async afterDelete(event) {
      const { result, params } = event
      const meilisearch = strapi.plugin('meilisearch').service('meilisearch')

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
    async afterDeleteMany() {
      strapi.log.error(
        `Meilisearch could not find an example on how to access the \`afterDeleteMany\` hook. Please consider making an issue to explain your use case`
      )
    },
  }
}
