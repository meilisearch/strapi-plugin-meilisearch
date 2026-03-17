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

      const entriesQuery = meilisearch.entriesQuery({ contentType })
      const shouldDeleteByLocale =
        entriesQuery.locale === '*' || entriesQuery.locale === 'all'
      const { status } = entriesQuery || {}
      const statusFilter =
        typeof status === 'string' && status.length > 0 ? { status } : {}

      const preDeleteDocumentId =
        deleteActions.includes(ctx.action) && ctx?.params?.documentId
          ? ctx.params.documentId
          : null
      let preDeleteEntry = null
      let preDeleteLocales = []

      if (preDeleteDocumentId != null) {
        preDeleteEntry = await contentTypeService.getEntry({
          contentType,
          documentId: preDeleteDocumentId,
          entriesQuery: { ...statusFilter },
        })

        if (shouldDeleteByLocale) {
          const localeVariants = await contentTypeService.getEntries({
            contentType,
            fields: ['documentId', 'locale'],
            locale: '*',
            ...statusFilter,
            filters: {
              documentId: preDeleteDocumentId,
            },
          })

          preDeleteLocales = [
            ...new Set(
              localeVariants
                .map(entry => entry?.locale)
                .filter(
                  locale => typeof locale === 'string' && locale.length > 0,
                ),
            ),
          ]
        }
      }

      result = await next()

      const documentId =
        result?.documentId ??
        preDeleteEntry?.documentId ??
        preDeleteDocumentId ??
        null

      if (updateActions.includes(ctx.action) && documentId != null) {
        const entry = await contentTypeService.getEntry({
          contentType,
          documentId,
          entriesQuery: { ...entriesQuery },
        })

        if (entry) {
          await meilisearch.updateEntriesInMeilisearch({
            contentType,
            entries: [entry],
          })
        } else {
          await meilisearch.deleteEntriesFromMeiliSearch({
            contentType,
            documentIds: [documentId],
            entriesQuery,
          })
        }
      } else if (deleteActions.includes(ctx.action)) {
        if (documentId != null) {
          strapi.log.info(
            `Meilisearch document middleware deleting ${contentType} documentId=${documentId}`,
          )
          await meilisearch.deleteEntriesFromMeiliSearch({
            contentType,
            documentIds: [documentId],
            entriesQuery,
            locales:
              shouldDeleteByLocale && preDeleteLocales.length > 0
                ? preDeleteLocales
                : undefined,
          })
        } else {
          strapi.log.info(
            `Meilisearch document middleware could not delete ${contentType} for action ${ctx.action}: missing documentId`,
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
