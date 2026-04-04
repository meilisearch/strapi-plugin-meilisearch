export default async function registerDocumentMiddleware({ strapi }) {
  if (!strapi?.documents || typeof strapi.documents.use !== 'function') {
    return
  }

  /**
   * Convert document service results into a flat list of entry-like objects.
   *
   * @param {object|object[]|null|undefined} result - Value returned by document service.
   *
   * @returns {object[]} Flat list of potential entries.
   */
  const getResultEntries = result => {
    if (result == null) return []

    const entries = []
    const appendEntry = value => {
      if (value != null && typeof value === 'object') {
        entries.push(value)
      }
    }

    if (Array.isArray(result)) {
      result.forEach(appendEntry)
      return entries
    }

    appendEntry(result)

    if (Array.isArray(result.versions)) {
      result.versions.forEach(appendEntry)
    }

    if (Array.isArray(result.entries)) {
      result.entries.forEach(appendEntry)
    }

    if (result.entry != null) {
      appendEntry(result.entry)
    }

    return entries
  }

  /**
   * Determine whether an entry represents a published version.
   *
   * @param {object} entry - Entry candidate.
   *
   * @returns {boolean} True when `publishedAt` is set.
   */
  const isPublishedEntry = entry =>
    !(entry?.publishedAt === undefined || entry?.publishedAt === null)

  /**
   * Pick the entry to index for update-like document actions.
   *
   * @param {object} options
   * @param {object[]|null|undefined} options.resultEntries - Entries extracted from result.
   * @param {string} options.documentId - Target document id.
   * @param {object} options.entriesQuery - Plugin entries query configuration.
   *
   * @returns {object|null} Selected entry to index, if any.
   */
  const getEntryFromResult = ({ resultEntries, documentId, entriesQuery }) => {
    const documentEntries = (resultEntries || []).filter(
      entry => entry?.documentId === documentId,
    )
    if (documentEntries.length === 0) return null

    if (entriesQuery?.status === 'draft') {
      return documentEntries[0]
    }

    return documentEntries.find(isPublishedEntry) || null
  }

  /**
   * Fetch an entry on the next event-loop turn to avoid leaking finished transactions.
   *
   * @param {object} options
   * @param {object} options.contentTypeService - Plugin content type service.
   * @param {string} options.contentType - Content type uid.
   * @param {string} options.documentId - Target document id.
   * @param {object} options.entriesQuery - Query used to fetch the indexable entry.
   *
   * @returns {Promise<object|null>} Entry to index or null.
   */
  const getEntryOutsideTransaction = ({
    contentTypeService,
    contentType,
    documentId,
    entriesQuery,
  }) =>
    new Promise((resolve, reject) => {
      setImmediate(async () => {
        try {
          const entry = await contentTypeService.getEntry({
            contentType,
            documentId,
            entriesQuery: { ...entriesQuery },
          })
          resolve(entry)
        } catch (error) {
          reject(error)
        }
      })
    })

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

      const contextDocumentId =
        typeof ctx?.params?.documentId === 'string' &&
        ctx.params.documentId.length > 0
          ? ctx.params.documentId
          : null

      const documentId =
        contextDocumentId ??
        result?.documentId ??
        preDeleteEntry?.documentId ??
        preDeleteDocumentId ??
        null

      if (updateActions.includes(ctx.action) && documentId != null) {
        const resultEntries = getResultEntries(result)
        let entry = getEntryFromResult({
          resultEntries,
          documentId,
          entriesQuery,
        })

        if (!entry) {
          entry = await getEntryOutsideTransaction({
            contentTypeService,
            contentType,
            documentId,
            entriesQuery,
          })
        }

        if (entry) {
          const normalizedEntry =
            entry.documentId === documentId ? entry : { ...entry, documentId }

          await meilisearch.updateEntriesInMeilisearch({
            contentType,
            entries: [normalizedEntry],
          })
        } else if (ctx.action === 'create' || ctx.action === 'publish') {
          await meilisearch.deleteEntriesFromMeiliSearch({
            contentType,
            documentIds: [documentId],
            entriesQuery,
          })
        } else {
          strapi.log.info(
            `Meilisearch document middleware skipped indexing ${contentType} documentId=${documentId} for action ${ctx.action}: no indexable entry in result payload`,
          )
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
