export default async function registerDocumentMiddleware({ strapi }) {
  if (!strapi?.documents || typeof strapi.documents.use !== 'function') {
    return
  }

  // Hook document service (only when available) to sync document changes into Meilisearch.
  // This middleware handles document lifecycle events (create, update, publish, unpublish, delete)
  // and ensures Meilisearch stays in sync with Strapi's published content.
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

      // Handle create, update, and publish-related actions via updateEntriesInMeilisearch.
      // IMPORTANT: Only published entries are indexed in Meilisearch (publishedAt != null).
      // - publish: entry is indexed in Meilisearch
      // - unpublish: entry is REMOVED from Meilisearch (sanitization filters it out, then deleteEntriesFromMeiliSearch is called)
      // - update/create with draft status: entry is NOT indexed or removed if already indexed
      // The sanitization flow in updateEntriesInMeilisearch handles this by:
      // 1. Filtering out entries without publishedAt (via removeUnpublishedArticles)
      // 2. Comparing original vs sanitized entries to determine deletions
      // 3. Calling deleteEntriesFromMeiliSearch for entries that were filtered out
      const updateLikeActions = [
        'create',
        'update',
        'publish',
        'unpublish',
        'discardDraft',
      ]
      if (
        updateLikeActions.includes(ctx.action) &&
        result?.documentId != null
      ) {
        // Re-fetch full entry (with relations per entriesQuery) after Strapi has persisted relations.
        // Explicitly set status: 'published' to match lifecycle behavior and enforce published-only indexing.
        const baseEntriesQuery = meilisearch.entriesQuery({
          contentType: ctx.uid,
        })
        const entry = await contentTypeService.getEntry({
          contentType: ctx.uid,
          documentId: result.documentId,
          entriesQuery: {
            ...baseEntriesQuery,
            locale: result.locale,
            status: 'published',
          },
        })
        const entryWithResultIds = entry
          ? { ...entry, id: result.id, documentId: result.documentId }
          : { id: result.id, documentId: result.documentId }

        await meilisearch.updateEntriesInMeilisearch({
          contentType: ctx.uid,
          entries: [entryWithResultIds],
        })
      }

      // Handle delete actions by removing entries from Meilisearch.
      if (ctx.action === 'delete') {
        const ids = []
        if (Array.isArray(result)) {
          // Bulk delete: collect all IDs from the array
          ids.push(...result.map(e => e?.id).filter(Boolean))
        } else if (result?.id != null) {
          // Single delete
          ids.push(result.id)
        }

        if (ids.length > 0) {
          await meilisearch.deleteEntriesFromMeiliSearch({
            contentType: ctx.uid,
            entriesId: ids,
          })
        }
      }
    } catch (error) {
      strapi.log.error(
        `Meilisearch document middleware error: ${error.message}`,
      )
    }

    return result
  })
}
