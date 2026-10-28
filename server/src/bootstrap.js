import { getRetryFailedSyncConfig } from './services/document-middleware/failed-sync-queue'
import { retryFailedSyncs } from './services/document-middleware/retry-failed-sync'

const RETRY_FAILED_SYNC_JOB = 'meilisearch-retry-failed-sync'

/**
 * Add listeners to the collection indexed in Meilisearch.
 *
 * @param  {object} options
 * @param  {object} options.store - store service.
 * @param  {object} options.lifecycle - lifecycle service.
 */
async function subscribeToLifecycles({ lifecycle, store }) {
  const contentTypes = await store.getIndexedContentTypes()
  await store.emptyListenedContentTypes()
  let lifecycles
  for (const contentType of contentTypes) {
    lifecycles = await lifecycle.subscribeContentType({ contentType })
  }

  return lifecycles
}

/**
 * Removed collections that are not indexed in Meilisearch
 * from the indexed store list.
 *
 * @param  {object} options
 * @param  {object} options.store - store service.
 * @param  {object} options.contentTypeService - contentType service.
 * @param  {object} options.meilisearch -  meilisearch service.
 */
async function syncIndexedCollections({
  store,
  contentTypeService,
  meilisearch,
}) {
  let indexUids
  try {
    indexUids = await meilisearch.fetchIndexUids()
  } catch (e) {
    // Meilisearch is unreachable (e.g. it starts after Strapi). Keep the stored
    // selection instead of treating every index as deleted, otherwise the
    // collections are silently unselected and stop being synced.
    strapi.log.warn(
      `meilisearch: could not fetch indexes from Meilisearch, keeping indexed collections (${e.message})`,
    )
    return
  }
  // All indexed contentTypes
  const indexedContentTypes = await store.getIndexedContentTypes()
  const contentTypes = contentTypeService.getContentTypesUid()

  for (const contentType of contentTypes) {
    const contentTypeIndexUids = await meilisearch.getIndexNamesOfContentType({
      contentType,
    })
    const indexesInMeiliSearch = contentTypeIndexUids.some(indexUid =>
      indexUids.includes(indexUid),
    )
    const contentTypeInIndexStore = indexedContentTypes.includes(contentType)

    // Remove any collection that is not in Meilisearch anymore
    if (!indexesInMeiliSearch && contentTypeInIndexStore) {
      await store.removeIndexedContentType({ contentType })
    }
  }
}

const registerPermissionActions = async () => {
  // Role Based Access Control
  const RBAC_ACTIONS = [
    {
      section: 'plugins',
      displayName: 'Access the Meilisearch',
      uid: 'read',
      pluginName: 'meilisearch',
    },
    {
      section: 'plugins',
      displayName: 'Create',
      uid: 'collections.create',
      subCategory: 'collections',
      pluginName: 'meilisearch',
    },
    {
      section: 'plugins',
      displayName: 'Update',
      uid: 'collections.update',
      subCategory: 'collections',
      pluginName: 'meilisearch',
    },
    {
      section: 'plugins',
      displayName: 'Delete',
      uid: 'collections.delete',
      subCategory: 'collections',
      pluginName: 'meilisearch',
    },
    {
      section: 'plugins',
      displayName: 'Edit',
      uid: 'settings.edit',
      subCategory: 'settings',
      pluginName: 'meilisearch',
    },
  ]

  await strapi.admin.services.permission.actionProvider.registerMany(
    RBAC_ACTIONS,
  )
}

export default async ({ strapi }) => {
  const store = strapi.plugin('meilisearch').service('store')
  const lifecycle = strapi.plugin('meilisearch').service('lifecycle')
  const meilisearch = strapi.plugin('meilisearch').service('meilisearch')
  const contentTypeService = strapi.plugin('meilisearch').service('contentType')

  // Sync credentials between store and plugin config file
  await store.syncCredentials()
  await syncIndexedCollections({
    store,
    contentTypeService,
    meilisearch,
  })
  await subscribeToLifecycles({
    lifecycle,
    store,
  })
  await registerPermissionActions()
  registerRetryFailedSyncJob({ strapi })
}

/**
 * Register the cron job that retries failed document syncs, when the
 * `retryFailedSync` option is configured.
 *
 * Note: Strapi's `server.cron.enabled` only controls tasks from the server
 * configuration; this job is controlled by the plugin option alone.
 *
 * @param  {object} options
 * @param  {object} options.strapi - Strapi instance.
 */
function registerRetryFailedSyncJob({ strapi }) {
  const config = getRetryFailedSyncConfig(strapi)
  if (!config) return

  strapi.cron.add({
    [RETRY_FAILED_SYNC_JOB]: {
      task: ({ strapi }) => retryFailedSyncs({ strapi }),
      options: { rule: config.rule },
    },
  })
  strapi.log.info(
    `meilisearch: retrying failed document syncs on cron rule "${config.rule}"`,
  )
}
