export default async function registerDocumentMiddleware({ strapi }) {
  if (!strapi?.documents || typeof strapi.documents.use !== 'function') {
    return
  }

  // Hook document service (only when available) to mirror Strapi creates into Meilisearch.
  strapi.documents.use(async (ctx, next) => {
    const result = await next()

    try {
      if (!result) {
        return result
      }

      const plugin = strapi.plugin('meilisearch')
      const store = plugin.service('store')
      const meilisearch = plugin.service('meilisearch')
      const contentTypeService = plugin.service('contentType')

      // Only act on content types the plugin is configured to listen to.
      const listenedContentTypes = await store.getListenedContentTypes()
      if (!listenedContentTypes.includes(ctx.uid)) {
        return result
      }

      const contentType = ctx.uid
      const id = result?.id
      const documentId = result?.documentId

      const updateActions = ['create', 'update', 'publish']
      const deleteActions = ['delete', 'unpublish', 'discardDraft']

      if (updateActions.includes(ctx.action) && documentId != null) {
        // Re-fetch full entry (with relations per entriesQuery) after Strapi has persisted relations.
        const entriesQuery = meilisearch.entriesQuery({ contentType })
        const entry = await contentTypeService.getEntry({
          contentType,
          documentId,
          entriesQuery: { ...entriesQuery },
        })

        if (entry) {
          await meilisearch.updateEntriesInMeilisearch({
            contentType,
            entries: [{ ...entry, id, documentId }],
          })
        } else if (id != null) {
          await meilisearch.deleteEntriesFromMeiliSearch({
            contentType,
            entriesId: [id],
          })
        }
      } else if (deleteActions.includes(ctx.action) && id != null) {
        await meilisearch.deleteEntriesFromMeiliSearch({
          contentType,
          entriesId: [id],
        })
      }
    } catch (error) {
      strapi.log.error(
        `Meilisearch document middleware error: ${error.message}`,
      )
    }

    return result
  })
}
