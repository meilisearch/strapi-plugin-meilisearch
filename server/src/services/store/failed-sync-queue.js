const QUEUE_KEY = 'meilisearch_failed_sync_queue'

/**
 * Build the deduplication key of a queued document.
 *
 * @param {{contentType: string, documentId: string}} item
 *
 * @returns {string}
 */
const itemKey = ({ contentType, documentId }) => `${contentType}::${documentId}`

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
     * @returns {Promise<{contentType: string, documentId: string}[]>}
     */
    getFailedSyncQueue: async function () {
      const queue = await store.getStoreKey({ key: QUEUE_KEY })
      return Array.isArray(queue) ? queue : []
    },

    /**
     * Queue documents for a later retry. Already queued documents are not added twice.
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
        const keys = new Set(queue.map(itemKey))
        let added = 0
        let dropped = 0

        for (const documentId of documentIds) {
          const item = { contentType, documentId }
          if (keys.has(itemKey(item))) continue
          if (queue.length >= maxSize) {
            dropped++
            continue
          }
          queue.push(item)
          keys.add(itemKey(item))
          added++
        }

        if (added > 0) {
          await store.setStoreKey({ key: QUEUE_KEY, value: queue })
        }
        return { added, dropped }
      })
    },

    /**
     * Remove documents from the retry queue.
     *
     * @param {object} options
     * @param {{contentType: string, documentId: string}[]} options.items - Documents to remove.
     *
     * @returns {Promise<number>} Number of documents left in the queue.
     */
    removeFailedSyncs: function ({ items }) {
      return serialize(async () => {
        const remove = new Set(items.map(itemKey))
        const queue = (await this.getFailedSyncQueue()).filter(
          item => !remove.has(itemKey(item)),
        )
        await store.setStoreKey({ key: QUEUE_KEY, value: queue })
        return queue.length
      })
    },
  }
}
