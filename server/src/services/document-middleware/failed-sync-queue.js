export const DEFAULT_MAX_QUEUE_SIZE = 10000

/**
 * Read the `retryFailedSync` plugin option.
 *
 * @param {object} strapi - Strapi instance.
 *
 * @returns {{rule: string, maxQueueSize: number} | null} Null when the feature is off.
 */
export const getRetryFailedSyncConfig = strapi => {
  const option = strapi.config?.get?.('plugin::meilisearch')?.retryFailedSync
  if (!option) return null
  return {
    rule: option.rule,
    maxQueueSize: option.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE,
  }
}

/**
 * Remember documents whose Meilisearch sync failed so the retry job can
 * process them later. Does nothing when `retryFailedSync` is not configured.
 * Never throws: queueing must not break the Strapi write.
 *
 * @param {object} options
 * @param {object} options.strapi - Strapi instance.
 * @param {string} options.contentType - Content type uid.
 * @param {string[]} options.documentIds - Strapi document ids of the failed sync.
 *
 * @returns {Promise<void>}
 */
export const queueFailedSync = async ({ strapi, contentType, documentIds }) => {
  try {
    const config = getRetryFailedSyncConfig(strapi)
    if (!config || !contentType || !documentIds?.length) return

    const store = strapi.plugin('meilisearch').service('store')
    const { added, dropped } = await store.addFailedSyncs({
      contentType,
      documentIds,
      maxSize: config.maxQueueSize,
    })
    if (added > 0) {
      strapi.log.warn(
        `meilisearch: queued ${added} document(s) of ${contentType} for a sync retry`,
      )
    }
    if (dropped > 0) {
      strapi.log.error(
        `meilisearch: sync retry queue is full (${config.maxQueueSize}), ${dropped} document(s) of ${contentType} not queued; re-index the collection from the plugin page`,
      )
    }
  } catch (error) {
    strapi.log.error(
      `meilisearch: could not queue failed sync for retry: ${error.message}`,
    )
  }
}
