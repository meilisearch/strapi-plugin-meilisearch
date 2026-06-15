/**
 * Execute a Strapi refetch on the next immediate turn.
 *
 * Post-action refetches should not run in the same transaction context as the
 * write action. Deferring with `setImmediate` keeps reads outside that scope.
 *
 * @param {Function} readOperation - Deferred read operation.
 *
 * @returns {Promise<unknown>} Result of the deferred read.
 */
const runDeferredRefetchRead = readOperation =>
  new Promise((resolve, reject) => {
    setImmediate(async () => {
      try {
        const readResult = await readOperation()
        resolve(readResult)
      } catch (error) {
        reject(error)
      }
    })
  })

/**
 * Refetch one Strapi entry on the next event-loop turn.
 *
 * The deferred read prevents middleware indexing reads from sharing the same
 * transaction context as the write action.
 *
 * @param {object} options - Refetch options.
 * @param {object} options.contentTypeService - Plugin content type service.
 * @param {string} options.contentType - Content type uid.
 * @param {string} options.documentId - Target Strapi document id.
 * @param {object|null|undefined} options.indexingQuery - Indexing query used for refetch.
 *
 * @returns {Promise<object|null>} Refetched Strapi entry or null.
 */
export const fetchSingleEntryAfterTransaction = ({
  contentTypeService,
  contentType,
  documentId,
  indexingQuery,
}) => {
  return runDeferredRefetchRead(() =>
    contentTypeService.getEntry({
      contentType,
      documentId,
      entriesQuery: { ...(indexingQuery || {}) },
    }),
  )
}

/**
 * Refetch all locale variants for one Strapi document.
 *
 * This path is used when both action and index locale scopes are wildcard.
 *
 * @param {object} options - Refetch options.
 * @param {object} options.contentTypeService - Plugin content type service.
 * @param {string} options.contentType - Content type uid.
 * @param {string} options.documentId - Target Strapi document id.
 * @param {object|null|undefined} options.indexingQuery - Base indexing query.
 *
 * @returns {Promise<object[]>} Refetched locale variants.
 */
export const fetchWildcardLocaleEntriesForIndexing = ({
  contentTypeService,
  contentType,
  documentId,
  indexingQuery,
}) => {
  const baseIndexingQuery = indexingQuery || {}

  return runDeferredRefetchRead(() =>
    contentTypeService.getEntries({
      contentType,
      ...baseIndexingQuery,
      locale: '*',
      filters: {
        ...(baseIndexingQuery.filters || {}),
        documentId,
      },
    }),
  )
}
