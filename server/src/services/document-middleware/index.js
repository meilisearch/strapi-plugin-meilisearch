import { isWildcardLocale } from '../meilisearch/config'

export default async function registerDocumentMiddleware({ strapi }) {
  if (!strapi?.documents || typeof strapi.documents.use !== 'function') {
    return
  }

  /**
   * Convert document service results into Strapi row candidates with source metadata.
   *
   * @param {object|object[]|null|undefined} result - Value returned by document service.
   *
   * @returns {{data: object, source: string}[]} Flat list of potential Strapi row candidates.
   */
  const extractStrapiRowCandidates = result => {
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
   * Determine whether a Strapi row represents a published version.
   *
   * @param {object} entry - Strapi row candidate.
   *
   * @returns {boolean} True when `publishedAt` is set.
   */
  const isPublishedStrapiRow = entry =>
    !(entry?.publishedAt === undefined || entry?.publishedAt === null)

  /**
   * Rank Strapi row candidates by row-likeness so nested rows beat root wrappers.
   * Rule 1: Real DB rows (has 'id' primary key) beat wrappers (no 'id').
   * Rule 2: Nested sources ('versions', 'entries') beat the 'root' source.
   *
   * @param {{data: object, source: string}[]} candidates - Candidates matching one Strapi document id.
   *
   * @returns {{data: object, source: string}[]} Ranked Strapi row candidates.
   */
  const rankStrapiRowCandidates = candidates => {
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
   * Pick the Strapi row to index for update-like Strapi document actions.
   *
   * @param {object} options
   * @param {{data: object, source: string}[]|null|undefined} options.resultCandidates - Candidate Strapi rows extracted from result.
   * @param {string} options.documentId - Target Strapi document id.
   * @param {object} options.syncQuery - Plugin sync query configuration.
   * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
   *
   * @returns {object|null} Selected Strapi row to index, if any.
   */
  const selectStrapiRowToIndexFromResult = ({
    resultCandidates,
    documentId,
    syncQuery,
    actionParams,
  }) => {
    const strapiDocumentRowCandidates = (resultCandidates || []).filter(
      candidate => candidate?.data?.documentId === documentId,
    )
    if (strapiDocumentRowCandidates.length === 0) return null

    const rankedRowCandidates = rankStrapiRowCandidates(
      strapiDocumentRowCandidates,
    )
    const actionLocale = getActionLocale(actionParams)
    const localeScopedRowCandidate =
      actionLocale && !isWildcardLocale(actionLocale)
        ? rankedRowCandidates.find(
            candidate => candidate?.data?.locale === actionLocale,
          )
        : null

    if (syncQuery?.status === 'draft') {
      const isIndexableDraftRowCandidate = candidate =>
        candidate?.data?.id != null && !isPublishedStrapiRow(candidate.data)
      const draftRowCandidate =
        localeScopedRowCandidate &&
        isIndexableDraftRowCandidate(localeScopedRowCandidate)
          ? localeScopedRowCandidate
          : rankedRowCandidates.find(isIndexableDraftRowCandidate)
      return draftRowCandidate?.data || null
    }

    const publishedRowCandidate =
      localeScopedRowCandidate &&
      isPublishedStrapiRow(localeScopedRowCandidate.data)
        ? localeScopedRowCandidate
        : rankedRowCandidates.find(candidate =>
            isPublishedStrapiRow(candidate.data),
          )

    return publishedRowCandidate?.data || null
  }

  /**
   * Fetch a Strapi row on the next event-loop turn to avoid leaking finished transactions.
   *
   * @param {object} options
   * @param {object} options.contentTypeService - Plugin content type service.
   * @param {string} options.contentType - Content type uid.
   * @param {string} options.documentId - Target Strapi document id.
   * @param {object} options.syncQuery - Query used to fetch the indexable Strapi row.
   *
   * @returns {Promise<object|null>} Strapi row to index or null.
   */
  const getStrapiRowAfterTransaction = ({
    contentTypeService,
    contentType,
    documentId,
    syncQuery,
  }) =>
    new Promise((resolve, reject) => {
      setImmediate(async () => {
        try {
          const strapiRow = await contentTypeService.getEntry({
            contentType,
            documentId,
            entriesQuery: { ...syncQuery },
          })
          resolve(strapiRow)
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
   * Build the locale-scoped query used by `getEntry` for update-like actions.
   *
   * When index config targets all locales (`*`) but the action is locale-scoped,
   * keep every existing query option and only override `locale` with the action locale.
   *
   * @param {object} options
   * @param {object|null|undefined} options.syncQuery - Base query from Meilisearch config.
   * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
   *
   * @returns {object} Query passed to `contentTypeService.getEntry`.
   */
  const resolveLocaleScopedReadQuery = ({ syncQuery, actionParams }) => {
    const actionLocale = getActionLocale(actionParams)
    const baseQuery = { ...(syncQuery || {}) }

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
   * @param {object|null} options.preDeleteStrapiRow - Row fetched before running the delete-like action.
   * @param {object[]|null|undefined} options.localeVariants - Locale variants fetched for wildcard action locales.
   *
   * @returns {string[]} Locales to remove from Meilisearch.
   */
  const resolveLocaleCodesToRemoveFromIndex = ({
    actionParams,
    preDeleteStrapiRow,
    localeVariants,
  }) => {
    const actionLocale = getActionLocale(actionParams)

    if (actionLocale && !isWildcardLocale(actionLocale)) {
      return [actionLocale]
    }

    if (actionLocale == null) {
      return typeof preDeleteStrapiRow?.locale === 'string' &&
        preDeleteStrapiRow.locale.length > 0
        ? [preDeleteStrapiRow.locale]
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
   * Resolve draft Strapi rows to index for `discardDraft` in draft-only indexes.
   *
   * @param {object} options
   * @param {{data: object, source: string}[]|null|undefined} options.resultCandidates - Candidate Strapi rows extracted from result.
   * @param {string} options.documentId - Target Strapi document id.
   * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
   *
   * @returns {object[]} Draft Strapi rows scoped to the requested action locale.
   */
  const selectDraftRowsForDiscardDraftResult = ({
    resultCandidates,
    documentId,
    actionParams,
  }) => {
    const actionLocale = getActionLocale(actionParams)
    const rankedDraftRowCandidates = rankStrapiRowCandidates(
      (resultCandidates || []).filter(
        candidate =>
          candidate?.data?.documentId === documentId &&
          !isPublishedStrapiRow(candidate.data),
      ),
    )
    const rankedLocalizedDraftRowCandidates = rankedDraftRowCandidates.filter(
      candidate =>
        typeof candidate?.data?.locale === 'string' &&
        candidate.data.locale.length > 0,
    )

    if (rankedDraftRowCandidates.length === 0) return []

    if (actionLocale && !isWildcardLocale(actionLocale)) {
      const localeCandidate = rankedLocalizedDraftRowCandidates.find(
        candidate => candidate?.data?.locale === actionLocale,
      )
      return localeCandidate ? [localeCandidate.data] : []
    }

    if (actionLocale && isWildcardLocale(actionLocale)) {
      const entriesByLocale = new Map()
      rankedLocalizedDraftRowCandidates.forEach(candidate => {
        const locale = candidate.data.locale
        if (!entriesByLocale.has(locale)) {
          entriesByLocale.set(locale, candidate.data)
        }
      })
      return [...entriesByLocale.values()]
    }

    return [
      rankedLocalizedDraftRowCandidates[0]?.data ||
        rankedDraftRowCandidates[0].data,
    ]
  }

  /**
   * Resolve published Strapi rows when wildcard action locale returns multiple versions.
   *
   * @param {object} options
   * @param {{data: object, source: string}[]|null|undefined} options.resultCandidates - Candidate Strapi rows extracted from result.
   * @param {string} options.documentId - Target Strapi document id.
   * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
   * @param {object|null|undefined} options.syncQuery - Plugin sync query configuration.
   *
   * @returns {object[]} Published Strapi rows keyed by locale/id for wildcard publish actions.
   */
  const selectPublishedRowsForWildcardPublish = ({
    resultCandidates,
    documentId,
    actionParams,
    syncQuery,
  }) => {
    const actionLocale = getActionLocale(actionParams)
    const syncStatusScope = syncQuery?.status
    const syncAllowsPublishedRows =
      syncStatusScope == null || syncStatusScope !== 'draft'
    if (
      !actionLocale ||
      !isWildcardLocale(actionLocale) ||
      !syncAllowsPublishedRows
    ) {
      return []
    }

    const rankedPublishedRowCandidates = rankStrapiRowCandidates(
      (resultCandidates || []).filter(
        candidate =>
          candidate?.data?.documentId === documentId &&
          isPublishedStrapiRow(candidate.data),
      ),
    )
    if (rankedPublishedRowCandidates.length === 0) return []

    const selectedRows = []
    const seenKeys = new Set()

    rankedPublishedRowCandidates.forEach(candidate => {
      const strapiRow = candidate?.data
      if (!strapiRow || typeof strapiRow !== 'object') return

      const localeKey =
        typeof strapiRow.locale === 'string' && strapiRow.locale.length > 0
          ? `locale:${strapiRow.locale}`
          : null
      const idKey = strapiRow.id != null ? `id:${strapiRow.id}` : null
      const dedupeKey = localeKey || idKey

      if (!dedupeKey || seenKeys.has(dedupeKey)) return
      seenKeys.add(dedupeKey)
      selectedRows.push(strapiRow)
    })

    return selectedRows
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

      const syncQuery = meilisearch.entriesQuery({ contentType })
      const indexSyncUsesWildcardLocale = isWildcardLocale(syncQuery.locale)
      const { status } = syncQuery || {}
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
      let preDeleteStrapiRow = null
      let localeCodesToRemove = []

      if (preDeleteDocumentId != null) {
        preDeleteStrapiRow = await contentTypeService.getEntry({
          contentType,
          documentId: preDeleteDocumentId,
          entriesQuery: { ...statusFilter },
        })

        if (indexSyncUsesWildcardLocale) {
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

          localeCodesToRemove = resolveLocaleCodesToRemoveFromIndex({
            actionParams: ctx?.params,
            preDeleteStrapiRow,
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
        preDeleteStrapiRow?.documentId ??
        preDeleteDocumentId ??
        null

      if (shouldTreatAsUpdateAction && documentId != null) {
        const resultCandidates = extractStrapiRowCandidates(result)
        let entriesToUpdate = []

        if (ctx.action === 'discardDraft' && isDraftIndex) {
          entriesToUpdate = selectDraftRowsForDiscardDraftResult({
            resultCandidates,
            documentId,
            actionParams: ctx?.params,
          })

          if (entriesToUpdate.length === 0) {
            const fallbackStrapiRow = await getStrapiRowAfterTransaction({
              contentTypeService,
              contentType,
              documentId,
              syncQuery: resolveLocaleScopedReadQuery({
                syncQuery,
                actionParams: ctx?.params,
              }),
            })
            if (fallbackStrapiRow && !isPublishedStrapiRow(fallbackStrapiRow)) {
              entriesToUpdate = [fallbackStrapiRow]
            }
          }
        } else {
          const publishedRowsFromWildcardPublish =
            selectPublishedRowsForWildcardPublish({
              resultCandidates,
              documentId,
              actionParams: ctx?.params,
              syncQuery,
            })
          if (publishedRowsFromWildcardPublish.length > 0) {
            entriesToUpdate = publishedRowsFromWildcardPublish
          }

          let strapiRow = selectStrapiRowToIndexFromResult({
            resultCandidates,
            documentId,
            syncQuery,
            actionParams: ctx?.params,
          })

          if (entriesToUpdate.length === 0 && !strapiRow) {
            strapiRow = await getStrapiRowAfterTransaction({
              contentTypeService,
              contentType,
              documentId,
              syncQuery: resolveLocaleScopedReadQuery({
                syncQuery,
                actionParams: ctx?.params,
              }),
            })
          }

          if (entriesToUpdate.length === 0 && strapiRow) {
            entriesToUpdate = [strapiRow]
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
            entriesQuery: syncQuery,
          })
        } else {
          strapi.log.info(
            `Meilisearch document middleware skipped indexing ${contentType} documentId=${documentId} for action ${ctx.action}: no indexable Strapi row in action result`,
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
            entriesQuery: syncQuery,
            locales:
              indexSyncUsesWildcardLocale && localeCodesToRemove.length > 0
                ? localeCodesToRemove
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
