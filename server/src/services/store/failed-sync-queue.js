const QUEUE_KEY = 'meilisearch_failed_sync_queue'

/**
 * Build the deduplication key of a queued document.
 *
 * @param {{contentType: string, documentId: string}} item
 *
 * @returns {string}
 */
const itemKey = ({ contentType, documentId }) => `${contentType}::${documentId}`

let generationCounter = 0

/**
 * Build a generation marker that is unique per queued failure, also across
 * restarts and after the queue was cleared.
 *
 * @returns {string}
 */
const nextGeneration = () => `${Date.now()}-${++generationCounter}`

export default ({ store }) => {
  // Queue mutations are read-modify-write on one store key. Chain them so
  // concurrent failures in this process cannot overwrite each other.
  let pending = Promise.resolve()
  const serialize = fn => {
    const run = pending.then(fn, fn)
    pending = run.catch(() => {})
    return run
  }

  return {
    /**
     * Get the documents whose Meilisearch sync failed and is waiting for a retry.
     *
     * @returns {Promise<{contentType: string, documentId: string, generation?: string}[]>}
     */
    getFailedSyncQueue: async function () {
      const queue = await store.getStoreKey({ key: QUEUE_KEY })
      return Array.isArray(queue) ? queue : []
    },

    /**
     * Queue documents for a later retry. Already queued documents are not added
     * twice, but get a new generation: a retry run that processed the older
     * failure must not remove the newer one.
     *
     * @param {object} options
     * @param {string} options.contentType - Content type uid.
     * @param {string[]} options.documentIds - Strapi document ids.
     * @param {number} options.maxSize - Maximum number of queued documents.
     *
     * @returns {Promise<{added: number, dropped: number}>}
     */
    addFailedSyncs: function ({ contentType, documentIds, maxSize }) {
      return serialize(async () => {
        const queue = await this.getFailedSyncQueue()
        const byKey = new Map(queue.map(item => [itemKey(item), item]))
        let added = 0
        let dropped = 0
        let renewed = 0

        for (const documentId of documentIds) {
          const item = { contentType, documentId, generation: nextGeneration() }
          const queued = byKey.get(itemKey(item))
          if (queued) {
            queued.generation = item.generation
            renewed++
            continue
          }
          if (queue.length >= maxSize) {
            dropped++
            continue
          }
          queue.push(item)
          byKey.set(itemKey(item), item)
          added++
        }

        if (added > 0 || renewed > 0) {
          await store.setStoreKey({ key: QUEUE_KEY, value: queue })
        }
        return { added, dropped }
      })
    },

    /**
     * Remove processed documents from the retry queue. An item is only removed
     * while its generation is unchanged, so a failure queued again during the
     * retry run stays queued.
     *
     * @param {object} options
     * @param {{contentType: string, documentId: string, generation?: string}[]} options.items - Processed queue items.
     *
     * @returns {Promise<number>} Number of documents left in the queue.
     */
    removeFailedSyncs: function ({ items }) {
      return serialize(async () => {
        const processed = new Map(
          items.map(item => [itemKey(item), item.generation]),
        )
        const queue = (await this.getFailedSyncQueue()).filter(
          item =>
            !processed.has(itemKey(item)) ||
            processed.get(itemKey(item)) !== item.generation,
        )
        await store.setStoreKey({ key: QUEUE_KEY, value: queue })
        return queue.length
      })
    },

    /**
     * Remove every queued document of a content type, e.g. when its index is
     * removed or fully rebuilt and a retry would be obsolete or unwanted.
     *
     * @param {object} options
     * @param {string} options.contentType - Content type uid.
     *
     * @returns {Promise<number>} Number of documents removed from the queue.
     */
    clearFailedSyncs: function ({ contentType }) {
      return serialize(async () => {
        const queue = await this.getFailedSyncQueue()
        const kept = queue.filter(item => item.contentType !== contentType)
        if (kept.length !== queue.length) {
          await store.setStoreKey({ key: QUEUE_KEY, value: kept })
        }
        return queue.length - kept.length
      })
    },
  }
}
