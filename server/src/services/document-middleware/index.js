export default async function registerDocumentMiddleware({ strapi }) {
  if (!strapi?.documents || typeof strapi.documents.use !== 'function') {
    return
  }

  // Hook document service (only when available) to mirror Strapi creates into Meilisearch.
  strapi.documents.use(async (ctx, next) => {
    const result = await next()

    try {
      const plugin = strapi.plugin('meilisearch')
      const store = plugin.service('store')
      const meilisearch = plugin.service('meilisearch')
      const contentTypeService = plugin.service('contentType')

      // Only act on content types the plugin is configured to listen to.
      const listenedContentTypes = await store.getListenedContentTypes()
      if (!listenedContentTypes.includes(ctx.uid)) {
        return result
      }

      if (ctx.action === 'create' && result?.documentId != null) {
        // Re-fetch full entry (with relations per entriesQuery) after Strapi has persisted relations.
        const entriesQuery = meilisearch.entriesQuery({ contentType: ctx.uid })
        const entry = await contentTypeService.getEntry({
          contentType: ctx.uid,
          documentId: result.documentId,
          entriesQuery: { ...entriesQuery },
        })
        const entryWithResultIds = entry
          ? { ...entry, id: result.id, documentId: result.documentId }
          : { id: result.id, documentId: result.documentId }

        await meilisearch.updateEntriesInMeilisearch({
          contentType: ctx.uid,
          entries: [entryWithResultIds],
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
