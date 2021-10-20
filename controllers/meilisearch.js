'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const {
  transformEntries,
  isCollectionACompositeIndex,
} = require('./../services/collection')

const { getIndexName } = require('./../services/indexes')

const meilisearch = {
  http: client => strapi.plugins.meilisearch.services.http(client),
  client: credentials =>
    strapi.plugins.meilisearch.services.client(credentials),
  // store: () => strapi.plugins.meilisearch.services.store,
  lifecycles: () => strapi.plugins.meilisearch.services.lifecycles,
}

async function sendCtx(ctx, fct) {
  try {
    const store = strapi.plugins.meilisearch.services.store
    const body = await fct(ctx, {
      store,
    })
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

async function getHookedCollections(store) {
  const hookedCollections = await store.getStoreKey('meilisearch_hooked')
  return hookedCollections || []
}

async function getCredentials(ctx, { store }) {
  const apiKey = await store.getStoreKey('meilisearch_api_key')
  const host = await store.getStoreKey('meilisearch_host')
  const configFileApiKey =
    (await store.getStoreKey('meilisearch_api_key_config')) || false
  const configFileHost =
    (await store.getStoreKey('meilisearch_host_config')) || false
  return { apiKey, host, configFileApiKey, configFileHost }
}

async function deleteAllIndexes(ctx, { store }) {
  const credentials = await getCredentials(ctx, { store })
  await meilisearch.http(meilisearch.client(credentials)).deleteIndexes()
  return { message: 'ok' }
}

async function removeCollection(ctx, { store, meiliSearchClient, lifecycles }) {
  const { collection } = ctx.params
  const isCompositeIndex = isCollectionACompositeIndex(collection)
  console.log('Delete resolver', { collection, isCompositeIndex })
  const credentials = await getCredentials(ctx, { store })
  if (!isCompositeIndex) {
    await meilisearch.http(meilisearch.client(credentials)).deleteIndex({
      indexUid: getIndexName(collection),
    })
  } else {
    // TODO if composite
    await meilisearch.http(meilisearch.client(credentials)).deleteIndex({
      indexUid: getIndexName(collection),
    })
  }
  return { message: 'ok' }
}

// TODO only delete when not composite
// or if composite only has one collection
async function deleteIndex(
  ctx,
  { store, meiliSearchClient, lifecycles, meiliSearchService }
) {
  const { collection } = ctx.params
  const credentials = await getCredentials(ctx, { store })
  await meilisearch.http(meilisearch.client(credentials)).deleteIndex({
    indexUid: getIndexName(collection),
  })
  return { message: 'ok' }
}

async function waitForCollectionIndexing(
  ctx,
  { store, meiliSearchClient, lifecycles }
) {
  const { collection } = ctx.params
  console.log('waitfor', collection)
  const credentials = await getCredentials(ctx, { store })
  const numberOfDocuments = await meilisearch
    .http(meilisearch.client(credentials))
    .waitForPendingUpdates({
      indexUid: getIndexName(collection),
      updateNbr: 2,
    })
  return { numberOfDocuments }
}

async function addCredentials(ctx, { store, meiliSearchClient, lifecycles }) {
  const { configFileApiKey, configFileHost } = await getCredentials(ctx, {
    store,
  })
  const { host: msHost, apiKey: msApiKey } = ctx.request.body
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
  return getCredentials(ctx, { store })
}

async function updateCollections(
  ctx,
  { store, meiliSearchClient, lifecycles }
) {
  const { collection } = ctx.params
  const credentials = await getCredentials(ctx, { store })
  // Delete whole index only if the index is not a composite index
  if (collection === getIndexName(collection)) {
    const { updateId } = await meilisearch
      .http(meilisearch.client(credentials))
      .deleteAllDocuments({
        indexUid: getIndexName(collection),
      })
    await meilisearch
      .http(meilisearch.client(credentials))
      .waitForPendingUpdate({
        updateId,
        indexUid: getIndexName(collection),
      })
  }
  return addCollection(ctx, { store, meiliSearchClient, lifecycles })
}

async function indexDocuments({ documents = [], collection }, store) {
  const credentials = await getCredentials({}, { store })
  const indexUid = getIndexName(collection)
  if (documents.length > 0) {
    return meilisearch.http(meilisearch.client(credentials)).addDocuments({
      indexUid,
      data: transformEntries(collection, documents),
    })
  }
}

async function fetchRowBatch({ start, limit, collection }) {
  return await strapi.services[collection].find({
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
    strapi.services[collection].count && strapi.services[collection].count()
  )
}

async function batchAddCollection(
  ctx,
  { store, meiliSearchClient, lifecycles }
) {
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
    const { updateId } = await indexDocuments(
      {
        collection,
        documents: rows,
      },
      store
    )
    if (updateId) updateIds.push(updateId)
  }
  return { updateIds }
}

async function addCollection(ctx, { store, meiliSearchClient, lifecycles }) {
  const { collection } = ctx.params
  const credentials = await getCredentials(ctx, { store })
  // Create collection in MeiliSearch
  await meilisearch.http(meilisearch.client(credentials)).createIndex({
    indexUid: collection,
  })
  batchAddCollection(ctx, { store, meiliSearchClient, lifecycles }) // does not wait for add documents requests
  return { message: 'Index created' }
}

async function getIndexes(store) {
  try {
    const credentials = await getCredentials({}, { store })
    return await meilisearch.http(meilisearch.client(credentials)).getIndexes()
  } catch (e) {
    return []
  }
}

async function getStats(collection, store) {
  // TODO should work for compositeIndexes as well
  const indexUid = getIndexName(collection)
  const credentials = await getCredentials({}, { store })
  return meilisearch
    .http(meilisearch.client(credentials))
    .getStats({ indexUid })
}

async function getCollections(ctx, { store }) {
  const indexes = await getIndexes(store)
  const hookedCollections = await getHookedCollections(store)
  const collectionTypes = getCollectionTypes()
  const collections = collectionTypes.map(async collection => {
    const indexUid = getIndexName(collection)
    console.log('getcol', { collection, indexUid })
    const existInMeilisearch = !!indexes.find(index => index.name === indexUid)
    const { numberOfDocuments = 0, isIndexing = false } = existInMeilisearch
      ? await getStats(collection, store)
      : {}

    const numberOfRows = await numberOfRowsInCollection({ collection })
    return {
      collection,
      indexUid,
      indexed: existInMeilisearch,
      isIndexing,
      numberOfDocuments,
      numberOfRows,
      hooked: hookedCollections.includes(collection),
    }
  })
  return { collections: await Promise.all(collections) }
}

async function reload(ctx, { store, meiliSearchClient, lifecycles }) {
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
  waitForCollectionIndexing: async ctx =>
    sendCtx(ctx, waitForCollectionIndexing),
  getCollections: async ctx => sendCtx(ctx, getCollections),
  addCollection: async ctx => sendCtx(ctx, addCollection),
  addCredentials: async ctx => sendCtx(ctx, addCredentials),
  deleteAllIndexes: async ctx => sendCtx(ctx, deleteAllIndexes),
  deleteIndex: async ctx => sendCtx(ctx, deleteIndex),
  removeCollection: async ctx => sendCtx(ctx, removeCollection),
  updateCollections: async ctx => sendCtx(ctx, updateCollections),
  reload: async ctx => sendCtx(ctx, reload),
  batchAddCollection: async ctx => sendCtx(ctx, batchAddCollection),
}
