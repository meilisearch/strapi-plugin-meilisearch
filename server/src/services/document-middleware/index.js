export default async function registerDocumentMiddleware({ strapi }) {
  if (!strapi?.documents || typeof strapi.documents.use !== 'function') {
    return
  }

  // Hook document service (only when available) to mirror Strapi creates into Meilisearch.
  strapi.documents.use(async (ctx, next) => {
    let result
    try {
      const plugin = strapi.plugin('meilisearch')
      const store = plugin.service('store')
      const meilisearch = plugin.service('meilisearch')
      const contentTypeService = plugin.service('contentType')

      const listenedContentTypes = await store.getListenedContentTypes()
      if (!listenedContentTypes.includes(ctx.uid)) {
        return next()
      }

      const contentType = ctx.uid
      const updateActions = ['create', 'update', 'publish']
      const deleteActions = [
        'delete',
        'deleteMany',
        'deleteOne',
        'deleteDocument',
        'unpublish',
        'discardDraft',
      ]

      const preDeleteDocumentId =
        deleteActions.includes(ctx.action) &&
        (ctx?.params?.documentId ?? ctx?.params?.id)
          ? ctx.params.documentId ?? ctx.params.id
          : null
      const preDeleteEntry =
        preDeleteDocumentId != null
          ? await contentTypeService.getEntry({
              contentType,
              documentId: preDeleteDocumentId,
              entriesQuery: {},
            })
          : null

      result = await next()

      const id = result?.id ?? preDeleteEntry?.id
      const documentId =
        result?.documentId ??
        preDeleteEntry?.documentId ??
        preDeleteDocumentId ??
        null

      if (updateActions.includes(ctx.action) && documentId != null) {
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
      } else if (deleteActions.includes(ctx.action)) {
        if (id != null) {
          strapi.log.info(
            `Meilisearch document middleware deleting ${contentType} ids=${id}`,
          )
          await meilisearch.deleteEntriesFromMeiliSearch({
            contentType,
            entriesId: [id],
          })
        } else {
          strapi.log.info(
            `Meilisearch document middleware could not delete ${contentType} for action ${ctx.action}: missing id`,
          )
        }
      }

      return result
    } catch (error) {
      strapi.log.error(
        `Meilisearch document middleware error: ${error.message}`,
      )
      return result
    }
  })
}
