import { isWildcardLocale } from '../meilisearch/config'
import { dispatchDeleteTargets, refetchEntriesAfterAction } from './index.js'

let running = false

/**
 * Retry the Meilisearch sync of documents queued by the document middleware.
 *
 * Each document is refetched from Strapi at retry time, so the index receives
 * its current state: still indexable entries are updated, documents that were
 * deleted or no longer match the indexing query are removed from the index.
 * Processing stops at the first failure; the remaining documents stay queued.
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

    const listenedContentTypes = await store.getListenedContentTypes()
    const processed = []

    for (const item of queue) {
      const { contentType, documentId } = item

      // Not listened anymore: the user deliberately stopped syncing it.
      if (!listenedContentTypes.includes(contentType)) {
        processed.push(item)
        continue
      }

      try {
        const indexingQuery = meilisearch.entriesQuery({ contentType })
        const entries = await refetchEntriesAfterAction({
          contentTypeService,
          contentType,
          documentId,
          indexingQuery,
        })

        if (entries.length > 0) {
          await meilisearch.updateEntriesInMeilisearch({
            contentType,
            entries: entries.map(entry =>
              entry.documentId === documentId
                ? entry
                : { ...entry, documentId },
            ),
          })
        } else {
          await dispatchDeleteTargets({
            meilisearch,
            contentType,
            indexingQuery,
            indexingQueryUsesWildcardLocale: isWildcardLocale(
              indexingQuery?.locale,
            ),
            targets: [{ documentId, localeCodes: [] }],
          })
        }
        processed.push(item)
      } catch (error) {
        strapi.log.error(
          `meilisearch: sync retry of ${contentType} documentId=${documentId} failed: ${error.message}`,
        )
        break
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
