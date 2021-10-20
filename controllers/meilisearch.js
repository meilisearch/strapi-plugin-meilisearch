'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const {
  transformEntries,
  isCollectionACompositeIndex,
  numberOfRowsInCollection,
  getCollectionTypes,
  fetchRowBatch,
} = require('./../services/collection')

const { getIndexName } = require('./../services/indexes')

async function sendCtx(ctx, fct) {
  try {
    const store = strapi.plugins.meilisearch.services.store
    const credentials = await getCredentials({}, { store })
    const client = strapi.plugins.meilisearch.services.client(credentials)
    const meilisearch = strapi.plugins.meilisearch.services.http(client)
    const body = await fct(ctx, {
      store,
      meilisearch,
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

async function deleteAllIndexes(ctx, { meilisearch }) {
  await meilisearch.deleteIndexes()
  return { message: 'ok' }
}

async function removeCollection(ctx, { meilisearch }) {
  const { collection } = ctx.params
  const isCompositeIndex = isCollectionACompositeIndex(collection)

  if (!isCompositeIndex) {
    await meilisearch.deleteIndex({
      indexUid: getIndexName(collection),
    })
  } else {
    // TODO if composite
    await meilisearch.deleteIndex({
      indexUid: getIndexName(collection),
    })
  }
  return { message: 'ok' }
}

// TODO only delete when not composite
// or if composite only has one collection
async function deleteIndex(ctx, { meilisearch }) {
  const { collection } = ctx.params

  await meilisearch.deleteIndex({
    indexUid: getIndexName(collection),
  })
  return { message: 'ok' }
}

async function waitForCollectionIndexing(ctx, { meilisearch }) {
  const { collection } = ctx.params
  const numberOfDocuments = await meilisearch.waitForPendingUpdates({
    indexUid: getIndexName(collection),
    updateNbr: 2,
  })
  return { numberOfDocuments }
}

async function addCredentials(ctx, { store }) {
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

async function updateCollections(ctx, { meilisearch }) {
  const { collection } = ctx.params

  // Delete whole index only if the index is not a composite index
  if (collection === getIndexName(collection)) {
    const { updateId } = await meilisearch.deleteAllDocuments({
      indexUid: getIndexName(collection),
    })
    await meilisearch.waitForPendingUpdate({
      updateId,
      indexUid: getIndexName(collection),
    })
  }
  return addCollection(ctx, { meilisearch })
}

async function indexDocuments({ documents = [], collection, meilisearch }) {
  const indexUid = getIndexName(collection)
  if (documents.length > 0) {
    return meilisearch.addDocuments({
      indexUid,
      data: transformEntries(collection, documents),
    })
  }
}

async function batchAddCollection(ctx, { meilisearch }) {
  const { collection } = ctx.params
  const count = await numberOfRowsInCollection(collection)
  const BATCH_SIZE = 1000
  const updateIds = []
  for (let index = 0; index <= count; index += BATCH_SIZE) {
    const rows = await fetchRowBatch({
      start: index,
      limit: BATCH_SIZE,
      collection,
    })
    const { updateId } = await indexDocuments({
      collection,
      documents: rows,
      meilisearch,
    })
    if (updateId) updateIds.push(updateId)
  }
  return { updateIds }
}

async function addCollection(ctx, { meilisearch }) {
  const { collection } = ctx.params
  // Create collection in MeiliSearch
  await meilisearch.createIndex({
    indexUid: collection,
  })
  batchAddCollection(ctx, { meilisearch }) // does not wait for add documents requests
  return { message: 'Index created' }
}

async function getIndexes(meilisearch) {
  try {
    return await meilisearch.getIndexes()
  } catch (e) {
    return []
  }
}

async function getStats(collection, meilisearch) {
  // TODO should work for compositeIndexes as well
  const indexUid = getIndexName(collection)
  return meilisearch.getStats({ indexUid })
}

async function getCollections(ctx, { store, meilisearch }) {
  const indexes = await getIndexes(meilisearch)
  const hookedCollections = await getHookedCollections(store)
  const collectionTypes = getCollectionTypes()
  const collections = collectionTypes.map(async collection => {
    const indexUid = getIndexName(collection)
    console.log('getcol', { collection, indexUid })
    const existInMeilisearch = !!indexes.find(index => index.name === indexUid)
    const { numberOfDocuments = 0, isIndexing = false } = existInMeilisearch
      ? await getStats(collection, meilisearch)
      : {}

    const numberOfRows = await numberOfRowsInCollection(collection)
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

async function reload(ctx, {}) {
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
