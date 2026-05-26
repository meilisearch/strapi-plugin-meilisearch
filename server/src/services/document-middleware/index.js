import { isWildcardLocale } from '../meilisearch/config'
import {
  resolveDocumentIds,
  resolveDocumentIdsFromActionParams,
} from './document-ids.js'
import {
  extractStrapiEntryCandidates,
  isPublishedStrapiEntry,
} from './entry-candidates.js'
import {
  selectDraftEntriesForDiscardDraftResult,
  selectPublishedEntriesForWildcardPublish,
  selectStrapiEntryToIndexFromResult,
} from './entry-selection.js'
import {
  collectLocaleCodesFromEntries,
  getActionLocale,
  resolveLocaleCodesToRemoveFromActionResult,
  resolveLocaleCodesToRemoveFromIndex,
  resolveLocaleScopedReadQuery,
} from './locale-resolution.js'

/**
 * Fetch a Strapi entry on the next event-loop turn to avoid leaking finished transactions.
 *
 * @param {object} options - Fetch options.
 * @param {object} options.contentTypeService - Plugin content type service.
 * @param {string} options.contentType - Content type uid.
 * @param {string} options.documentId - Target Strapi document id.
 * @param {object} options.syncQuery - Query used to fetch the indexable Strapi entry.
 *
 * @returns {Promise<object|null>} Strapi entry to index or null.
 */
const getStrapiEntryAfterTransaction = ({
  contentTypeService,
  contentType,
  documentId,
  syncQuery,
}) =>
  new Promise((resolve, reject) => {
    setImmediate(async () => {
      try {
        const strapiEntry = await contentTypeService.getEntry({
          contentType,
          documentId,
          entriesQuery: { ...syncQuery },
        })
        resolve(strapiEntry)
      } catch (error) {
        reject(error)
      }
    })
  })

/**
 * Build the pre-action snapshot for one document id.
 *
 * @param {object} options - Snapshot options.
 * @param {object} options.contentTypeService - Plugin content type service.
 * @param {string} options.contentType - Content type uid.
 * @param {string} options.documentId - Target Strapi document id.
 * @param {object|null|undefined} options.statusFilter - Optional status scope from sync query.
 * @param {object|null|undefined} options.actionParams - Action params from middleware context.
 * @param {boolean} options.indexSyncUsesWildcardLocale - Whether index config stores all locales.
 *
 * @returns {Promise<{documentId: string, preDeleteStrapiEntry: object|null, localeVariants: object[], localeCodesToRemove: string[]}>}
 */
const buildPreActionSnapshot = async ({
  contentTypeService,
  contentType,
  documentId,
  statusFilter,
  actionParams,
  indexSyncUsesWildcardLocale,
}) => {
  const preDeleteStrapiEntry = await contentTypeService.getEntry({
    contentType,
    documentId,
    entriesQuery: { ...(statusFilter || {}) },
  })

  const shouldFetchLocaleVariants =
    indexSyncUsesWildcardLocale && isWildcardLocale(actionParams?.locale)
  const localeVariants = shouldFetchLocaleVariants
    ? await contentTypeService.getEntries({
        contentType,
        fields: ['documentId', 'locale'],
        locale: '*',
        ...(statusFilter || {}),
        filters: {
          documentId,
        },
      })
    : []

  const localeCodesToRemove = indexSyncUsesWildcardLocale
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
 * @param {object|null|undefined} options.statusFilter - Optional status scope from sync query.
 * @param {object|null|undefined} options.actionParams - Action params from middleware context.
 * @param {boolean} options.indexSyncUsesWildcardLocale - Whether index config stores all locales.
 *
 * @returns {Promise<Array<{documentId: string, preDeleteStrapiEntry: object|null, localeVariants: object[], localeCodesToRemove: string[]}>>}
 */
const collectPreActionSnapshots = async ({
  documentIds,
  contentTypeService,
  contentType,
  statusFilter,
  actionParams,
  indexSyncUsesWildcardLocale,
}) => {
  return Promise.all(
    documentIds.map(documentId =>
      buildPreActionSnapshot({
        contentTypeService,
        contentType,
        documentId,
        statusFilter,
        actionParams,
        indexSyncUsesWildcardLocale,
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
 * @param {object} options.syncQuery - Plugin sync query configuration.
 * @param {boolean} options.indexSyncUsesWildcardLocale - Whether index config stores all locales.
 * @param {{documentId: string, localeCodes?: string[]}[]} options.targets - Delete targets.
 *
 * @returns {Promise<void>}
 */
const dispatchDeleteTargets = async ({
  meilisearch,
  contentType,
  syncQuery,
  indexSyncUsesWildcardLocale,
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
    const localeCodes = indexSyncUsesWildcardLocale
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
      entriesQuery: syncQuery,
      locales:
        indexSyncUsesWildcardLocale && group.localeCodes.length > 0
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

      const preActionDocumentIds = resolveDocumentIdsFromActionParams(
        ctx?.params,
      )
      const shouldCollectPreActionSnapshots =
        shouldTreatAsDeleteAction ||
        (ctx.action === 'discardDraft' && isDraftIndex)
      const preActionSnapshots = shouldCollectPreActionSnapshots
        ? await collectPreActionSnapshots({
            documentIds: preActionDocumentIds,
            contentTypeService,
            contentType,
            statusFilter,
            actionParams: ctx?.params,
            indexSyncUsesWildcardLocale,
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

      if (shouldTreatAsUpdateAction && documentIds.length > 0) {
        const resultCandidates = extractStrapiEntryCandidates(result)
        const entriesToUpdate = []
        const deleteTargets = []

        for (const documentId of documentIds) {
          if (ctx.action === 'discardDraft' && isDraftIndex) {
            const preActionSnapshot =
              preActionSnapshotsByDocumentId.get(documentId) || null
            const actionLocale = getActionLocale(ctx?.params)
            const shouldLoadDraftEntriesAcrossLocales =
              indexSyncUsesWildcardLocale && isWildcardLocale(actionLocale)

            const draftEntriesFromResult =
              selectDraftEntriesForDiscardDraftResult({
                resultCandidates,
                documentId,
                actionParams: ctx?.params,
              })

            let draftEntriesToUpdate = shouldLoadDraftEntriesAcrossLocales
              ? await contentTypeService.getEntries({
                  contentType,
                  locale: '*',
                  ...statusFilter,
                  filters: {
                    documentId,
                  },
                })
              : draftEntriesFromResult

            draftEntriesToUpdate = (draftEntriesToUpdate || []).filter(
              entry => entry && !isPublishedStrapiEntry(entry),
            )

            if (
              draftEntriesToUpdate.length === 0 &&
              shouldLoadDraftEntriesAcrossLocales
            ) {
              draftEntriesToUpdate = draftEntriesFromResult
            }

            if (
              draftEntriesToUpdate.length === 0 &&
              !shouldLoadDraftEntriesAcrossLocales
            ) {
              const fallbackStrapiEntry = await getStrapiEntryAfterTransaction({
                contentTypeService,
                contentType,
                documentId,
                syncQuery: resolveLocaleScopedReadQuery({
                  syncQuery,
                  actionParams: ctx?.params,
                }),
              })

              if (
                fallbackStrapiEntry &&
                !isPublishedStrapiEntry(fallbackStrapiEntry)
              ) {
                draftEntriesToUpdate = [fallbackStrapiEntry]
              }
            }

            if (draftEntriesToUpdate.length > 0) {
              const normalizedDraftEntries = draftEntriesToUpdate.map(entry =>
                entry.documentId === documentId
                  ? entry
                  : { ...entry, documentId },
              )
              entriesToUpdate.push(...normalizedDraftEntries)
            }

            const preActionLocaleCodes = resolveLocaleCodesToRemoveFromIndex({
              actionParams: ctx?.params,
              preDeleteStrapiEntry:
                preActionSnapshot?.preDeleteStrapiEntry || null,
              localeVariants: preActionSnapshot?.localeVariants || [],
            })
            const remainingLocaleCodes =
              collectLocaleCodesFromEntries(draftEntriesToUpdate)
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

          let entriesForDocument = []
          const publishedEntriesFromWildcardPublish =
            selectPublishedEntriesForWildcardPublish({
              resultCandidates,
              documentId,
              actionParams: ctx?.params,
              syncQuery,
            })
          if (publishedEntriesFromWildcardPublish.length > 0) {
            entriesForDocument = publishedEntriesFromWildcardPublish
          }

          let strapiEntry = selectStrapiEntryToIndexFromResult({
            resultCandidates,
            documentId,
            syncQuery,
            actionParams: ctx?.params,
          })

          if (entriesForDocument.length === 0 && !strapiEntry) {
            strapiEntry = await getStrapiEntryAfterTransaction({
              contentTypeService,
              contentType,
              documentId,
              syncQuery: resolveLocaleScopedReadQuery({
                syncQuery,
                actionParams: ctx?.params,
              }),
            })
          }

          if (entriesForDocument.length === 0 && strapiEntry) {
            entriesForDocument = [strapiEntry]
          }

          if (entriesForDocument.length > 0) {
            const normalizedEntries = entriesForDocument.map(entry =>
              entry.documentId === documentId
                ? entry
                : { ...entry, documentId },
            )
            entriesToUpdate.push(...normalizedEntries)
          } else if (ctx.action === 'create' || ctx.action === 'publish') {
            const createPublishLocaleCodesToRemove = indexSyncUsesWildcardLocale
              ? resolveLocaleCodesToRemoveFromActionResult({
                  actionParams: ctx?.params,
                  resultCandidates,
                  result,
                  documentId,
                })
              : []

            deleteTargets.push({
              documentId,
              localeCodes: createPublishLocaleCodesToRemove,
            })
          } else {
            strapi.log.info(
              `Meilisearch document middleware skipped indexing ${contentType} documentId=${documentId} for action ${ctx.action}: no indexable Strapi entry in action result`,
            )
          }
        }

        if (entriesToUpdate.length > 0) {
          await meilisearch.updateEntriesInMeilisearch({
            contentType,
            entries: entriesToUpdate,
          })
        }

        if (deleteTargets.length > 0) {
          await dispatchDeleteTargets({
            meilisearch,
            contentType,
            syncQuery,
            indexSyncUsesWildcardLocale,
            targets: deleteTargets,
          })
        }
      } else if (shouldTreatAsDeleteAction) {
        if (documentIds.length > 0) {
          const deleteTargets = documentIds.map(documentId => {
            const preActionSnapshot =
              preActionSnapshotsByDocumentId.get(documentId) || null
            return {
              documentId,
              localeCodes: indexSyncUsesWildcardLocale
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
            syncQuery,
            indexSyncUsesWildcardLocale,
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
