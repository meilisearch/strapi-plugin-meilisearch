import { isWildcardLocale } from '../meilisearch/config'

export default async function registerDocumentMiddleware({ strapi }) {
  if (!strapi?.documents || typeof strapi.documents.use !== 'function') {
    return
  }

  /**
   * Convert document service results into entry candidates with source metadata.
   *
   * @param {object|object[]|null|undefined} result - Value returned by document service.
   *
   * @returns {{data: object, source: string}[]} Flat list of potential entry candidates.
   */
  const extractEntryCandidates = result => {
    if (result == null) return []

    const candidates = []
    const appendCandidate = (data, source) => {
      if (data != null && typeof data === 'object') {
        candidates.push({ data, source })
      }
    }

    if (Array.isArray(result)) {
      result.forEach(data => appendCandidate(data, 'root'))
      return candidates
    }

    appendCandidate(result, 'root')

    if (Array.isArray(result.versions)) {
      result.versions.forEach(data => appendCandidate(data, 'versions'))
    }

    if (Array.isArray(result.entries)) {
      result.entries.forEach(data => appendCandidate(data, 'entries'))
    }

    if (result.entry != null) {
      appendCandidate(result.entry, 'entry')
    }

    return candidates
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
   * Rank candidates by entry-likeness so nested rows beat root wrappers.
   * Rule 1: Real DB rows (has 'id' primary key) beat wrappers (no 'id').
   * Rule 2: Nested sources ('versions', 'entries') beat the 'root' source.
   *
   * @param {{data: object, source: string}[]} candidates - Candidates matching one documentId.
   *
   * @returns {{data: object, source: string}[]} Ranked candidates.
   */
  const rankEntryCandidates = candidates => {
    return [...candidates].sort((a, b) => {
      const aHasPrimaryKey = a.data?.id != null
      const bHasPrimaryKey = b.data?.id != null

      if (aHasPrimaryKey && !bHasPrimaryKey) return -1
      if (!aHasPrimaryKey && bHasPrimaryKey) return 1

      const aIsRoot = a.source === 'root'
      const bIsRoot = b.source === 'root'

      if (!aIsRoot && bIsRoot) return -1
      if (aIsRoot && !bIsRoot) return 1

      return 0
    })
  }

  /**
   * Pick the entry to index for update-like document actions.
   *
   * @param {object} options
   * @param {{data: object, source: string}[]|null|undefined} options.resultCandidates - Candidate entries extracted from result.
   * @param {string} options.documentId - Target document id.
   * @param {object} options.entriesQuery - Plugin entries query configuration.
   * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
   *
   * @returns {object|null} Selected entry to index, if any.
   */
  const getEntryFromResult = ({
    resultCandidates,
    documentId,
    entriesQuery,
    actionParams,
  }) => {
    const documentCandidates = (resultCandidates || []).filter(
      candidate => candidate?.data?.documentId === documentId,
    )
    if (documentCandidates.length === 0) return null

    const rankedCandidates = rankEntryCandidates(documentCandidates)
    const actionLocale = getActionLocale(actionParams)
    const localeScopedCandidate =
      actionLocale && !isWildcardLocale(actionLocale)
        ? rankedCandidates.find(
            candidate => candidate?.data?.locale === actionLocale,
          )
        : null

    if (entriesQuery?.status === 'draft') {
      const isIndexableDraftCandidate = candidate =>
        candidate?.data?.id != null && !isPublishedEntry(candidate.data)
      const draftCandidate =
        localeScopedCandidate &&
        isIndexableDraftCandidate(localeScopedCandidate)
          ? localeScopedCandidate
          : rankedCandidates.find(isIndexableDraftCandidate)
      return draftCandidate?.data || null
    }

    const publishedCandidate =
      localeScopedCandidate && isPublishedEntry(localeScopedCandidate.data)
        ? localeScopedCandidate
        : rankedCandidates.find(candidate => isPublishedEntry(candidate.data))

    return publishedCandidate?.data || null
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

  /**
   * Resolve an explicit action locale from middleware params.
   *
   * @param {object|null|undefined} actionParams - Action params from document middleware context.
   *
   * @returns {string|null} Locale from params when present.
   */
  const getActionLocale = actionParams => {
    return typeof actionParams?.locale === 'string' &&
      actionParams.locale.length > 0
      ? actionParams.locale
      : null
  }

  /**
   * Build the fallback query used by `getEntry` for update-like actions.
   *
   * When index config targets all locales (`*`) but the action is locale-scoped,
   * keep every existing query option and only override `locale` with the action locale.
   *
   * @param {object} options
   * @param {object|null|undefined} options.entriesQuery - Base query from Meilisearch config.
   * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
   *
   * @returns {object} Query passed to `contentTypeService.getEntry`.
   */
  const resolveFallbackEntriesQuery = ({ entriesQuery, actionParams }) => {
    const actionLocale = getActionLocale(actionParams)
    const baseQuery = { ...(entriesQuery || {}) }

    if (!isWildcardLocale(baseQuery.locale) || actionLocale == null) {
      return baseQuery
    }

    return {
      ...baseQuery,
      locale: actionLocale,
    }
  }

  /**
   * Resolve locales to remove from locale-scoped indexes for delete-like actions.
   *
   * @param {object} options
   * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
   * @param {object|null} options.preDeleteEntry - Entry fetched before running the delete-like action.
   * @param {object[]|null|undefined} options.localeVariants - Locale variants fetched for wildcard action locales.
   *
   * @returns {string[]} Locales to remove from Meilisearch.
   */
  const resolveDeleteLocales = ({
    actionParams,
    preDeleteEntry,
    localeVariants,
  }) => {
    const actionLocale = getActionLocale(actionParams)

    if (actionLocale && !isWildcardLocale(actionLocale)) {
      return [actionLocale]
    }

    if (actionLocale == null) {
      return typeof preDeleteEntry?.locale === 'string' &&
        preDeleteEntry.locale.length > 0
        ? [preDeleteEntry.locale]
        : []
    }

    return [
      ...new Set(
        (localeVariants || [])
          .map(entry => entry?.locale)
          .filter(locale => typeof locale === 'string' && locale.length > 0),
      ),
    ]
  }

  /**
   * Resolve draft entries to index for `discardDraft` in draft-only indexes.
   *
   * @param {object} options
   * @param {{data: object, source: string}[]|null|undefined} options.resultCandidates - Candidate entries extracted from result.
   * @param {string} options.documentId - Target document id.
   * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
   *
   * @returns {object[]} Draft entries scoped to the requested action locale.
   */
  const getDiscardDraftEntriesFromResult = ({
    resultCandidates,
    documentId,
    actionParams,
  }) => {
    const actionLocale = getActionLocale(actionParams)
    const rankedDraftCandidates = rankEntryCandidates(
      (resultCandidates || []).filter(
        candidate =>
          candidate?.data?.documentId === documentId &&
          !isPublishedEntry(candidate.data),
      ),
    )
    const rankedLocalizedDraftCandidates = rankedDraftCandidates.filter(
      candidate =>
        typeof candidate?.data?.locale === 'string' &&
        candidate.data.locale.length > 0,
    )

    if (rankedDraftCandidates.length === 0) return []

    if (actionLocale && !isWildcardLocale(actionLocale)) {
      const localeCandidate = rankedLocalizedDraftCandidates.find(
        candidate => candidate?.data?.locale === actionLocale,
      )
      return localeCandidate ? [localeCandidate.data] : []
    }

    if (actionLocale && isWildcardLocale(actionLocale)) {
      const entriesByLocale = new Map()
      rankedLocalizedDraftCandidates.forEach(candidate => {
        const locale = candidate.data.locale
        if (!entriesByLocale.has(locale)) {
          entriesByLocale.set(locale, candidate.data)
        }
      })
      return [...entriesByLocale.values()]
    }

    return [
      rankedLocalizedDraftCandidates[0]?.data || rankedDraftCandidates[0].data,
    ]
  }

  /**
   * Resolve publish entries when wildcard action locale returns multiple versions.
   *
   * @param {object} options
   * @param {{data: object, source: string}[]|null|undefined} options.resultCandidates - Candidate entries extracted from result.
   * @param {string} options.documentId - Target document id.
   * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
   * @param {object|null|undefined} options.entriesQuery - Plugin entries query configuration.
   *
   * @returns {object[]} Published entries keyed by locale/id for wildcard publish actions.
   */
  const getPublishEntriesFromResult = ({
    resultCandidates,
    documentId,
    actionParams,
    entriesQuery,
  }) => {
    const actionLocale = getActionLocale(actionParams)
    const statusScope = entriesQuery?.status
    const allowsPublishedEntries =
      statusScope == null || statusScope !== 'draft'
    if (
      !actionLocale ||
      !isWildcardLocale(actionLocale) ||
      !allowsPublishedEntries
    ) {
      return []
    }

    const rankedPublishedCandidates = rankEntryCandidates(
      (resultCandidates || []).filter(
        candidate =>
          candidate?.data?.documentId === documentId &&
          isPublishedEntry(candidate.data),
      ),
    )
    if (rankedPublishedCandidates.length === 0) return []

    const selectedEntries = []
    const seenKeys = new Set()

    rankedPublishedCandidates.forEach(candidate => {
      const entry = candidate?.data
      if (!entry || typeof entry !== 'object') return

      const localeKey =
        typeof entry.locale === 'string' && entry.locale.length > 0
          ? `locale:${entry.locale}`
          : null
      const idKey = entry.id != null ? `id:${entry.id}` : null
      const dedupeKey = localeKey || idKey

      if (!dedupeKey || seenKeys.has(dedupeKey)) return
      seenKeys.add(dedupeKey)
      selectedEntries.push(entry)
    })

    return selectedEntries
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
      const shouldDeleteByLocale = isWildcardLocale(entriesQuery.locale)
      const { status } = entriesQuery || {}
      const statusFilter =
        typeof status === 'string' && status.length > 0 ? { status } : {}
      const isDraftIndex = status === 'draft'
      const isPublishedIndex = status === 'published'

      const shouldSkipDeleteAction =
        (ctx.action === 'unpublish' && isDraftIndex) ||
        (ctx.action === 'discardDraft' && isPublishedIndex)
      const shouldTreatAsUpdateAction =
        updateActions.includes(ctx.action) ||
        (ctx.action === 'discardDraft' && isDraftIndex)
      const shouldTreatAsDeleteAction =
        deleteActions.includes(ctx.action) &&
        !shouldTreatAsUpdateAction &&
        !shouldSkipDeleteAction

      const preDeleteDocumentId =
        shouldTreatAsDeleteAction && ctx?.params?.documentId
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
          const shouldFetchLocaleVariants = isWildcardLocale(
            ctx?.params?.locale,
          )
          const localeVariants = shouldFetchLocaleVariants
            ? await contentTypeService.getEntries({
                contentType,
                fields: ['documentId', 'locale'],
                locale: '*',
                ...statusFilter,
                filters: {
                  documentId: preDeleteDocumentId,
                },
              })
            : []

          preDeleteLocales = resolveDeleteLocales({
            actionParams: ctx?.params,
            preDeleteEntry,
            localeVariants,
          })
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

      if (shouldTreatAsUpdateAction && documentId != null) {
        const resultCandidates = extractEntryCandidates(result)
        let entriesToUpdate = []

        if (ctx.action === 'discardDraft' && isDraftIndex) {
          entriesToUpdate = getDiscardDraftEntriesFromResult({
            resultCandidates,
            documentId,
            actionParams: ctx?.params,
          })

          if (entriesToUpdate.length === 0) {
            const fallbackEntry = await getEntryOutsideTransaction({
              contentTypeService,
              contentType,
              documentId,
              entriesQuery: resolveFallbackEntriesQuery({
                entriesQuery,
                actionParams: ctx?.params,
              }),
            })
            if (fallbackEntry && !isPublishedEntry(fallbackEntry)) {
              entriesToUpdate = [fallbackEntry]
            }
          }
        } else {
          const publishResultEntries = getPublishEntriesFromResult({
            resultCandidates,
            documentId,
            actionParams: ctx?.params,
            entriesQuery,
          })
          if (publishResultEntries.length > 0) {
            entriesToUpdate = publishResultEntries
          }

          let entry = getEntryFromResult({
            resultCandidates,
            documentId,
            entriesQuery,
            actionParams: ctx?.params,
          })

          if (entriesToUpdate.length === 0 && !entry) {
            entry = await getEntryOutsideTransaction({
              contentTypeService,
              contentType,
              documentId,
              entriesQuery: resolveFallbackEntriesQuery({
                entriesQuery,
                actionParams: ctx?.params,
              }),
            })
          }

          if (entriesToUpdate.length === 0 && entry) {
            entriesToUpdate = [entry]
          }
        }

        if (entriesToUpdate.length > 0) {
          const normalizedEntries = entriesToUpdate.map(entry =>
            entry.documentId === documentId ? entry : { ...entry, documentId },
          )

          await meilisearch.updateEntriesInMeilisearch({
            contentType,
            entries: normalizedEntries,
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
      } else if (shouldTreatAsDeleteAction) {
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
