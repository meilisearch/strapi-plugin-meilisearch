'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const meilisearch = {
  http: client => strapi.plugins.meilisearch.services.http(client),
  client: credentials =>
    strapi.plugins.meilisearch.services.client(credentials),
  store: () => strapi.plugins.meilisearch.services.store,
  lifecycles: () => strapi.plugins.meilisearch.services.lifecycles,
}

async function sendCtx(ctx, fct) {
  try {
    const body = await fct(ctx)
    ctx.send(body)
  } catch (e) {
    console.error(e)
    const message =
      e.name === 'MeiliSearchCommunicationError'
        ? `Could not connect with MeiliSearch ${e.code}`
        : `${e.name}: \n${e.message || e.code}`
    return {
      error: true,
      message,
      link: e.errorLink,
    }
  }
}

async function getHookedCollections() {
  const store = await meilisearch.store()
  const hookedCollections = await store.getStoreKey('meilisearch_hooked')
  return hookedCollections || []
}

async function getCredentials() {
  const store = await meilisearch.store()
  const apiKey = await store.getStoreKey('meilisearch_api_key')
  const host = await store.getStoreKey('meilisearch_host')
  const configFileApiKey =
    (await store.getStoreKey('meilisearch_api_key_config')) || false
  const configFileHost =
    (await store.getStoreKey('meilisearch_host_config')) || false
  return { apiKey, host, configFileApiKey, configFileHost }
}

async function deleteAllIndexes() {
  const credentials = await getCredentials()
  await meilisearch.http(meilisearch.client(credentials)).deleteIndexes()
  return { message: 'ok' }
}

async function deleteIndex(ctx) {
  const { indexUid } = ctx.params
  const credentials = await getCredentials()
  await meilisearch.http(meilisearch.client(credentials)).deleteIndex({
    indexUid,
  })
  return { message: 'ok' }
}

async function waitForDocumentsToBeIndexed(ctx) {
  const { indexUid } = ctx.params
  const credentials = await getCredentials()
  const numberOfDocuments = await meilisearch
    .http(meilisearch.client(credentials))
    .waitForPendingUpdates({
      indexUid,
      updateNbr: 2,
    })
  return { numberOfDocuments }
}

async function addCredentials(ctx) {
  const { configFileApiKey, configFileHost } = await getCredentials()
  const { host: msHost, apiKey: msApiKey } = ctx.request.body
  const store = await meilisearch.store()
  if (!configFileApiKey) {
    await store.setStoreKey({
      key: 'meilisearch_api_key',
      value: msApiKey,
    })
  }
  if (!configFileHost) {
    await store.setStoreKey({
      key: 'meilisearch_host',
      value: msHost,
    })
  }
  return getCredentials()
}

async function UpdateCollections(ctx) {
  const { collection: indexUid } = ctx.params
  const credentials = await getCredentials()
  const { updateId } = await meilisearch
    .http(meilisearch.client(credentials))
    .deleteAllDocuments({
      indexUid,
    })
  await meilisearch.http(meilisearch.client(credentials)).waitForPendingUpdate({
    updateId,
    indexUid,
  })
  return addCollection(ctx)
}

async function indexDocuments({ documents = [], collection }) {
  const credentials = await getCredentials()
  if (documents.length > 0) {
    return meilisearch.http(meilisearch.client(credentials)).addDocuments({
      indexUid: collection,
      data: documents,
    })
  }
}

async function fetchRowBatch({ start, limit, collection }) {
  return strapi.services[collection].find({
    _publicationState: 'preview',
    _limit: limit,
    _start: start,
  })
}

function getCollectionTypes() {
  const services = strapi.services
  return Object.keys(services).filter(type => {
    return services[type].count
  })
}

async function numberOfRowsInCollection({ collection }) {
  return (
    strapi.services[collection].count &&
    strapi.services[collection].count({ _publicationState: 'preview' })
  )
}

async function batchAddCollection(ctx) {
  const { collection } = ctx.params
  const count = await numberOfRowsInCollection({ collection })
  const BATCH_SIZE = 1000
  const updateIds = []
  for (let index = 0; index <= count; index += BATCH_SIZE) {
    const rows = await fetchRowBatch({
      start: index,
      limit: BATCH_SIZE,
      collection,
    })
    const { updateId } = await indexDocuments({ collection, documents: rows })
    if (updateId) updateIds.push(updateId)
  }
  return { updateIds }
}

async function addCollection(ctx) {
  const { collection } = ctx.params
  const credentials = await getCredentials()
  // Create collection in MeiliSearch
  await meilisearch.http(meilisearch.client(credentials)).createIndex({
    indexUid: collection,
  })
  batchAddCollection(ctx) // does not wait for add documents requests
  return { message: 'Index created' }
}

async function getIndexes() {
  try {
    const credentials = await getCredentials()
    return await meilisearch.http(meilisearch.client(credentials)).getIndexes()
  } catch (e) {
    return []
  }
}

async function getStats({ collection }) {
  const credentials = await getCredentials()
  return meilisearch
    .http(meilisearch.client(credentials))
    .getStats({ indexUid: collection })
}

async function getCollections() {
  const indexes = await getIndexes()
  const hookedCollections = await getHookedCollections()
  const collectionTypes = getCollectionTypes()

  const collections = collectionTypes.map(async collection => {
    const existInMeilisearch = !!indexes.find(
      index => index.name === collection
    )
    const { numberOfDocuments = 0, isIndexing = false } = existInMeilisearch
      ? await getStats({ collection })
      : {}
    const numberOfRows = await numberOfRowsInCollection({ collection })
    return {
      name: collection,
      indexed: existInMeilisearch,
      isIndexing,
      numberOfDocuments,
      numberOfRows,
      hooked: hookedCollections.includes(collection),
    }
  })
  return { collections: await Promise.all(collections) }
}

async function reload(ctx) {
  ctx.send('ok')
  const {
    config: { autoReload },
  } = strapi
  if (!autoReload) {
    return {
      message:
        'Reload is only possible in develop mode. Please reload server manually.',
      title: 'Reload failed',
      error: true,
      link:
        'https://strapi.io/documentation/developer-docs/latest/developer-resources/cli/CLI.html#strapi-start',
    }
  } else {
    strapi.reload.isWatching = false
    strapi.reload()
    return { message: 'ok' }
  }
}

module.exports = {
  getCredentials: async ctx => sendCtx(ctx, getCredentials),
  indexDocuments: async ctx => sendCtx(ctx, indexDocuments),
  waitForDocumentsToBeIndexed: async ctx =>
    sendCtx(ctx, waitForDocumentsToBeIndexed),
  getIndexes: async ctx => sendCtx(ctx, getIndexes),
  getCollections: async ctx => sendCtx(ctx, getCollections),
  addCollection: async ctx => sendCtx(ctx, addCollection),
  addCredentials: async ctx => sendCtx(ctx, addCredentials),
  deleteAllIndexes: async ctx => sendCtx(ctx, deleteAllIndexes),
  deleteIndex: async ctx => sendCtx(ctx, deleteIndex),
  UpdateCollections: async ctx => sendCtx(ctx, UpdateCollections),
  reload: async ctx => sendCtx(ctx, reload),
  batchAddCollection: async ctx => sendCtx(ctx, batchAddCollection),
}
