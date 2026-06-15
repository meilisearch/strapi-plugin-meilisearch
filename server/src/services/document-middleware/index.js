import { isWildcardLocale } from '../meilisearch/config'
import {
  resolveDocumentIds,
  resolveDocumentIdsFromActionParams,
} from './document-ids.js'
import {
  extractStrapiEntryCandidates,
  isPublishedStrapiEntry,
} from './entry-candidates.js'
import { selectDraftEntriesForDiscardDraftResult } from './entry-selection.js'
import {
  collectLocaleCodesFromEntries,
  getActionLocale,
  resolveLocaleCodesToRemoveFromIndex,
  resolveLocaleScopedRefetchQuery,
} from './locale-resolution.js'
import {
  fetchSingleEntryAfterTransaction,
  fetchWildcardLocaleEntriesForIndexing,
} from './entry-refetch.js'

/**
 * Build the pre-action snapshot for one document id.
 *
 * @param {object} options - Snapshot options.
 * @param {object} options.contentTypeService - Plugin content type service.
 * @param {string} options.contentType - Content type uid.
 * @param {string} options.documentId - Target Strapi document id.
 * @param {object|null|undefined} options.indexingStatusFilter - Optional status scope from indexing query.
 * @param {object|null|undefined} options.actionParams - Action params from middleware context.
 * @param {boolean} options.indexingQueryUsesWildcardLocale - Whether index config stores all locales.
 *
 * @returns {Promise<{documentId: string, preDeleteStrapiEntry: object|null, localeVariants: object[], localeCodesToRemove: string[]}>}
 */
const buildPreActionSnapshot = async ({
  contentTypeService,
  contentType,
  documentId,
  indexingStatusFilter,
  actionParams,
  indexingQueryUsesWildcardLocale,
}) => {
  const preDeleteStrapiEntry = await contentTypeService.getEntry({
    contentType,
    documentId,
    entriesQuery: { ...(indexingStatusFilter || {}) },
  })

  const shouldFetchLocaleVariants =
    indexingQueryUsesWildcardLocale && isWildcardLocale(actionParams?.locale)
  const localeVariants = shouldFetchLocaleVariants
    ? await contentTypeService.getEntries({
        contentType,
        fields: ['documentId', 'locale'],
        locale: '*',
        ...(indexingStatusFilter || {}),
        filters: {
          documentId,
        },
      })
    : []

  const localeCodesToRemove = indexingQueryUsesWildcardLocale
    ? resolveLocaleCodesToRemoveFromIndex({
        actionParams,
        preDeleteStrapiEntry,
        localeVariants,
      })
    : []

  return {
    documentId,
    preDeleteStrapiEntry,
    localeVariants,
    localeCodesToRemove,
  }
}

/**
 * Collect pre-action snapshots for every target document.
 *
 * @param {object} options - Snapshot collection options.
 * @param {string[]} options.documentIds - Target document ids.
 * @param {object} options.contentTypeService - Plugin content type service.
 * @param {string} options.contentType - Content type uid.
 * @param {object|null|undefined} options.indexingStatusFilter - Optional status scope from indexing query.
 * @param {object|null|undefined} options.actionParams - Action params from middleware context.
 * @param {boolean} options.indexingQueryUsesWildcardLocale - Whether index config stores all locales.
 *
 * @returns {Promise<Array<{documentId: string, preDeleteStrapiEntry: object|null, localeVariants: object[], localeCodesToRemove: string[]}>>}
 */
const collectPreActionSnapshots = async ({
  documentIds,
  contentTypeService,
  contentType,
  indexingStatusFilter,
  actionParams,
  indexingQueryUsesWildcardLocale,
}) => {
  return Promise.all(
    documentIds.map(documentId =>
      buildPreActionSnapshot({
        contentTypeService,
        contentType,
        documentId,
        indexingStatusFilter,
        actionParams,
        indexingQueryUsesWildcardLocale,
      }),
    ),
  )
}

/**
 * Normalize locale codes into a stable, unique list.
 *
 * @param {string[]|null|undefined} localeCodes - Locale codes to normalize.
 *
 * @returns {string[]} Normalized locale codes.
 */
const normalizeLocaleCodes = localeCodes => {
  return [
    ...new Set(
      (localeCodes || [])
        .filter(locale => typeof locale === 'string' && locale.length > 0)
        .map(locale => locale.trim()),
    ),
  ]
}

/**
 * Dispatch one or more Meilisearch delete requests.
 *
 * The middleware batches deletes when targets share the same locale set and
 * fans out to per-document deletes when locale scopes differ.
 *
 * @param {object} options - Delete dispatch options.
 * @param {object} options.meilisearch - Meilisearch plugin service.
 * @param {string} options.contentType - Content type uid.
 * @param {object} options.indexingQuery - Plugin indexing query configuration.
 * @param {boolean} options.indexingQueryUsesWildcardLocale - Whether index config stores all locales.
 * @param {{documentId: string, localeCodes?: string[]}[]} options.targets - Delete targets.
 *
 * @returns {Promise<void>}
 */
const dispatchDeleteTargets = async ({
  meilisearch,
  contentType,
  indexingQuery,
  indexingQueryUsesWildcardLocale,
  targets,
}) => {
  const validTargets = (targets || []).filter(
    target =>
      target &&
      typeof target.documentId === 'string' &&
      target.documentId.length > 0,
  )
  if (validTargets.length === 0) return

  const groupedTargets = new Map()
  validTargets.forEach(target => {
    const localeCodes = indexingQueryUsesWildcardLocale
      ? normalizeLocaleCodes(target.localeCodes)
      : []
    const groupKey =
      localeCodes.length > 0
        ? [...localeCodes].sort().join('|')
        : '__no-locales__'
    const currentGroup = groupedTargets.get(groupKey)
    if (currentGroup) {
      currentGroup.documentIds.push(target.documentId)
      return
    }

    groupedTargets.set(groupKey, {
      documentIds: [target.documentId],
      localeCodes,
    })
  })

  for (const group of groupedTargets.values()) {
    await meilisearch.deleteEntriesFromMeiliSearch({
      contentType,
      documentIds: [...new Set(group.documentIds)],
      entriesQuery: indexingQuery,
      locales:
        indexingQueryUsesWildcardLocale && group.localeCodes.length > 0
          ? group.localeCodes
          : undefined,
    })
  }
}

export default async function registerDocumentMiddleware({ strapi }) {
  if (!strapi?.documents || typeof strapi.documents.use !== 'function') {
    return
  }

  // Hook document service (only when available) to mirror Strapi changes into Meilisearch.
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

      const indexingQuery = meilisearch.entriesQuery({ contentType })
      const indexingQueryUsesWildcardLocale = isWildcardLocale(
        indexingQuery.locale,
      )
      const { status } = indexingQuery || {}
      const indexingStatusFilter =
        typeof status === 'string' && status.length > 0 ? { status } : {}
      const isDraftIndex = status === 'draft'
      const isPublishedIndex = status === 'published'

      const shouldSkipDeleteAction =
        (ctx.action === 'unpublish' && isDraftIndex) ||
        (ctx.action === 'discardDraft' && isPublishedIndex)
      const shouldProcessAsRefetchFirstIndexingAction =
        updateActions.includes(ctx.action) ||
        (ctx.action === 'discardDraft' && isDraftIndex)
      const shouldProcessAsDeleteAction =
        deleteActions.includes(ctx.action) &&
        !shouldProcessAsRefetchFirstIndexingAction &&
        !shouldSkipDeleteAction

      const preActionDocumentIds = resolveDocumentIdsFromActionParams(
        ctx?.params,
      )
      const shouldCollectPreActionSnapshots =
        shouldProcessAsDeleteAction ||
        (ctx.action === 'discardDraft' && isDraftIndex)
      const preActionSnapshots = shouldCollectPreActionSnapshots
        ? await collectPreActionSnapshots({
            documentIds: preActionDocumentIds,
            contentTypeService,
            contentType,
            indexingStatusFilter,
            actionParams: ctx?.params,
            indexingQueryUsesWildcardLocale,
          })
        : []
      const preActionSnapshotsByDocumentId = new Map(
        preActionSnapshots.map(snapshot => [snapshot.documentId, snapshot]),
      )

      result = await next()

      const documentIds = resolveDocumentIds({
        actionParams: ctx?.params,
        result,
        preActionSnapshots,
      })

      if (shouldProcessAsRefetchFirstIndexingAction && documentIds.length > 0) {
        const actionResultCandidates = extractStrapiEntryCandidates(result)
        const entriesToIndex = []
        const deleteTargets = []

        for (const documentId of documentIds) {
          if (ctx.action === 'discardDraft' && isDraftIndex) {
            // discardDraft in draft indexes remains snapshot-driven: refetch/update
            // draft entries, then remove locales that existed pre-action but not after.
            const preActionSnapshot =
              preActionSnapshotsByDocumentId.get(documentId) || null
            const actionLocale = getActionLocale(ctx?.params)
            const shouldLoadDraftEntriesAcrossLocales =
              indexingQueryUsesWildcardLocale && isWildcardLocale(actionLocale)

            const draftEntriesFromActionResult =
              selectDraftEntriesForDiscardDraftResult({
                resultCandidates: actionResultCandidates,
                documentId,
                actionParams: ctx?.params,
              })

            let draftEntriesToIndex = shouldLoadDraftEntriesAcrossLocales
              ? await contentTypeService.getEntries({
                  contentType,
                  locale: '*',
                  ...indexingStatusFilter,
                  filters: {
                    documentId,
                  },
                })
              : draftEntriesFromActionResult

            draftEntriesToIndex = (draftEntriesToIndex || []).filter(
              entry => entry && !isPublishedStrapiEntry(entry),
            )

            if (
              draftEntriesToIndex.length === 0 &&
              shouldLoadDraftEntriesAcrossLocales
            ) {
              draftEntriesToIndex = draftEntriesFromActionResult
            }

            if (
              draftEntriesToIndex.length === 0 &&
              !shouldLoadDraftEntriesAcrossLocales
            ) {
              const refetchedDraftEntry =
                await fetchSingleEntryAfterTransaction({
                  contentTypeService,
                  contentType,
                  documentId,
                  indexingQuery: resolveLocaleScopedRefetchQuery({
                    indexingQuery,
                    actionParams: ctx?.params,
                  }),
                })

              if (
                refetchedDraftEntry &&
                !isPublishedStrapiEntry(refetchedDraftEntry)
              ) {
                draftEntriesToIndex = [refetchedDraftEntry]
              }
            }

            if (draftEntriesToIndex.length > 0) {
              const normalizedDraftEntries = draftEntriesToIndex.map(entry =>
                entry.documentId === documentId
                  ? entry
                  : { ...entry, documentId },
              )
              entriesToIndex.push(...normalizedDraftEntries)
            }

            const preActionLocaleCodes = resolveLocaleCodesToRemoveFromIndex({
              actionParams: ctx?.params,
              preDeleteStrapiEntry:
                preActionSnapshot?.preDeleteStrapiEntry || null,
              localeVariants: preActionSnapshot?.localeVariants || [],
            })
            const remainingLocaleCodes =
              collectLocaleCodesFromEntries(draftEntriesToIndex)
            const localeCodesToDelete = preActionLocaleCodes.filter(
              localeCode => !remainingLocaleCodes.includes(localeCode),
            )

            if (localeCodesToDelete.length > 0) {
              deleteTargets.push({
                documentId,
                localeCodes: localeCodesToDelete,
              })
            }

            continue
          }

          let refetchedEntriesForDocument = []
          const actionLocale = getActionLocale(ctx?.params)
          const localeScopedRefetchQuery = resolveLocaleScopedRefetchQuery({
            indexingQuery,
            actionParams: ctx?.params,
          })
          const indexingQueryStoresDrafts = indexingQuery?.status === 'draft'
          const shouldRefetchAllLocales =
            indexingQueryUsesWildcardLocale &&
            isWildcardLocale(actionLocale) &&
            isWildcardLocale(indexingQuery?.locale) &&
            !indexingQueryStoresDrafts

          if (shouldRefetchAllLocales) {
            refetchedEntriesForDocument =
              await fetchWildcardLocaleEntriesForIndexing({
                contentTypeService,
                contentType,
                documentId,
                indexingQuery,
              })
          } else {
            const refetchedStrapiEntry = await fetchSingleEntryAfterTransaction(
              {
                contentTypeService,
                contentType,
                documentId,
                indexingQuery: localeScopedRefetchQuery,
              },
            )

            if (refetchedStrapiEntry) {
              refetchedEntriesForDocument = [refetchedStrapiEntry]
            }
          }

          if (refetchedEntriesForDocument.length > 0) {
            const normalizedEntries = refetchedEntriesForDocument.map(entry =>
              entry.documentId === documentId
                ? entry
                : { ...entry, documentId },
            )
            entriesToIndex.push(...normalizedEntries)
          } else if (ctx.action === 'create' || ctx.action === 'publish') {
            const createPublishLocaleCodesToRemove =
              indexingQueryUsesWildcardLocale &&
              typeof localeScopedRefetchQuery?.locale === 'string' &&
              localeScopedRefetchQuery.locale.length > 0 &&
              !isWildcardLocale(localeScopedRefetchQuery.locale)
                ? [localeScopedRefetchQuery.locale]
                : []

            deleteTargets.push({
              documentId,
              localeCodes: createPublishLocaleCodesToRemove,
            })
          } else {
            strapi.log.info(
              `Meilisearch document middleware skipped indexing ${contentType} documentId=${documentId} for action ${ctx.action}: no indexable Strapi entry after refetch`,
            )
          }
        }

        if (entriesToIndex.length > 0) {
          await meilisearch.updateEntriesInMeilisearch({
            contentType,
            entries: entriesToIndex,
          })
        }

        if (deleteTargets.length > 0) {
          await dispatchDeleteTargets({
            meilisearch,
            contentType,
            indexingQuery,
            indexingQueryUsesWildcardLocale,
            targets: deleteTargets,
          })
        }
      } else if (shouldProcessAsDeleteAction) {
        if (documentIds.length > 0) {
          const deleteTargets = documentIds.map(documentId => {
            const preActionSnapshot =
              preActionSnapshotsByDocumentId.get(documentId) || null
            return {
              documentId,
              localeCodes: indexingQueryUsesWildcardLocale
                ? preActionSnapshot?.localeCodesToRemove || []
                : [],
            }
          })

          strapi.log.info(
            `Meilisearch document middleware deleting ${contentType} documentIds=${documentIds.join(',')}`,
          )
          await dispatchDeleteTargets({
            meilisearch,
            contentType,
            indexingQuery,
            indexingQueryUsesWildcardLocale,
            targets: deleteTargets,
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
