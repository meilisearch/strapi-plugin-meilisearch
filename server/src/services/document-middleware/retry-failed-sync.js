import { isWildcardLocale } from '../meilisearch/config'
import { dispatchDeleteTargets, refetchEntriesAfterAction } from './index.js'

let running = false

/**
 * Get the codes of all locales configured in Strapi.
 *
 * @param {object} strapi - Strapi instance.
 *
 * @returns {Promise<string[]>} Empty when the i18n plugin is not available.
 */
const getConfiguredLocaleCodes = async strapi => {
  const localesService = strapi.plugin('i18n')?.service?.('locales')
  if (!localesService) return []
  const locales = await localesService.find()
  return (locales || [])
    .map(locale => locale?.code)
    .filter(code => typeof code === 'string' && code.length > 0)
}

/**
 * Sync one queued document with its current Strapi state.
 *
 * The queue does not know which locale variants were indexed before the
 * failure, so all-locale indexes remove every configured locale that is not
 * indexable anymore (deleting an absent document is a no-op in Meilisearch).
 *
 * @param {object} options
 * @param {object} options.strapi - Strapi instance.
 * @param {object} options.store - Plugin store service.
 * @param {object} options.meilisearch - Plugin Meilisearch service.
 * @param {object} options.contentTypeService - Plugin content type service.
 * @param {string} options.contentType - Content type uid.
 * @param {string} options.documentId - Strapi document id.
 *
 * @returns {Promise<boolean>} False when the content type stopped being indexed meanwhile.
 */
const syncQueuedDocument = async ({
  strapi,
  store,
  meilisearch,
  contentTypeService,
  contentType,
  documentId,
}) => {
  const indexingQuery = meilisearch.entriesQuery({ contentType })
  const usesWildcardLocale = isWildcardLocale(indexingQuery?.locale)
  const entries = await refetchEntriesAfterAction({
    contentTypeService,
    contentType,
    documentId,
    indexingQuery,
  })

  // Narrow the window for an un-index that happened during the refetch.
  // ponytail: no lock between the retry and manual index actions; the regular
  // document middleware has the same window.
  const indexedContentTypes = await store.getIndexedContentTypes()
  if (!indexedContentTypes.includes(contentType)) return false

  const deleteTargets = []
  if (entries.length > 0) {
    await meilisearch.updateEntriesInMeilisearch({
      contentType,
      entries: entries.map(entry =>
        entry.documentId === documentId ? entry : { ...entry, documentId },
      ),
    })
    const indexedLocales = entries.map(entry => entry.locale).filter(Boolean)
    if (usesWildcardLocale && indexedLocales.length > 0) {
      const staleLocales = (await getConfiguredLocaleCodes(strapi)).filter(
        code => !indexedLocales.includes(code),
      )
      if (staleLocales.length > 0) {
        deleteTargets.push({ documentId, localeCodes: staleLocales })
      }
    }
  } else {
    // Document without a locale suffix (not localized content type).
    deleteTargets.push({ documentId, localeCodes: [] })
    if (usesWildcardLocale) {
      const localeCodes = await getConfiguredLocaleCodes(strapi)
      if (localeCodes.length > 0) {
        deleteTargets.push({ documentId, localeCodes })
      }
    }
  }

  if (deleteTargets.length > 0) {
    await dispatchDeleteTargets({
      meilisearch,
      contentType,
      indexingQuery,
      indexingQueryUsesWildcardLocale: usesWildcardLocale,
      targets: deleteTargets,
    })
  }
  return true
}

/**
 * Retry the Meilisearch sync of documents queued by the document middleware.
 *
 * Each document is refetched from Strapi at retry time, so the index receives
 * its current state: still indexable entries are updated, documents that were
 * deleted or no longer match the indexing query are removed from the index.
 * A failing document stays queued; the run continues while Meilisearch is
 * reachable and stops as soon as it is not.
 *
 * @param {object} options
 * @param {object} options.strapi - Strapi instance.
 *
 * @returns {Promise<{retried: number, remaining: number} | null>} Null when skipped.
 */
export async function retryFailedSyncs({ strapi }) {
  // Only one run at a time within this process.
  if (running) return null
  running = true

  try {
    const plugin = strapi.plugin('meilisearch')
    const store = plugin.service('store')
    const meilisearch = plugin.service('meilisearch')
    const contentTypeService = plugin.service('contentType')

    const queue = await store.getFailedSyncQueue()
    if (queue.length === 0) return null

    try {
      await meilisearch.fetchIndexUids()
    } catch (error) {
      strapi.log.warn(
        `meilisearch: still unreachable, ${queue.length} document(s) waiting for a sync retry (${error.message})`,
      )
      return null
    }

    const processed = []

    for (const item of queue) {
      const { contentType, documentId } = item

      // Re-read per item: selection changes during a long run take effect.
      const listenedContentTypes = await store.getListenedContentTypes()
      const indexedContentTypes = await store.getIndexedContentTypes()

      // Not listened anymore: the user deliberately stopped syncing it.
      if (!listenedContentTypes.includes(contentType)) {
        processed.push(item)
        continue
      }
      // Listened but not indexed: a re-index is in progress or the index is
      // missing. Keep the item; un-indexing and re-indexing clear the queue.
      if (!indexedContentTypes.includes(contentType)) continue

      try {
        const synced = await syncQueuedDocument({
          strapi,
          store,
          meilisearch,
          contentTypeService,
          contentType,
          documentId,
        })
        if (synced) processed.push(item)
      } catch (error) {
        strapi.log.error(
          `meilisearch: sync retry of ${contentType} documentId=${documentId} failed: ${error.message}`,
        )
        // Keep going past a document that fails on its own, so it cannot
        // block the queue; stop when Meilisearch became unreachable.
        try {
          await meilisearch.fetchIndexUids()
        } catch {
          break
        }
      }
    }

    const remaining = await store.removeFailedSyncs({ items: processed })
    strapi.log.info(
      `meilisearch: sync retry processed ${processed.length} document(s), ${remaining} left`,
    )
    return { retried: processed.length, remaining }
  } catch (error) {
    strapi.log.error(`meilisearch: sync retry failed: ${error.message}`)
    return null
  } finally {
    running = false
  }
}
