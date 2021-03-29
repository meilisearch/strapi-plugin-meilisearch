'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const meilisearch = {
  http: (client) => strapi.plugins.meilisearch.services.http(client),
  client: (credentials) => strapi.plugins.meilisearch.services.client(credentials),
  store: () => strapi.plugins.meilisearch.services.store,
  lifecycles: () => strapi.plugins.meilisearch.services.lifecycles
}

async function sendCtx (ctx, fct) {
  try {
    const body = await fct(ctx)
    ctx.send(body)
  } catch (e) {
    console.error(e)
    const message = (e.type === 'MeiliSearchCommunicationError')
      ? `Could not connect with MeiliSearch ${e.code}`
      : `${e.type}: \n${e.message || e.code}`
    return {
      error: true,
      message,
      link: e.errorLink
    }
  }
}

async function getHookedCollections () {
  const store = await meilisearch.store()
  const hookedCollections = await store.getStoreKey('meilisearch_hooked')
  return hookedCollections || []
}

async function getCredentials () {
  const store = await meilisearch.store()
  const apiKey = await store.getStoreKey('meilisearch_api_key')
  const host = await store.getStoreKey('meilisearch_host')
  return { apiKey, host }
}

async function deleteAllIndexes () {
  const credentials = await getCredentials()
  await meilisearch.http(meilisearch.client(credentials)).deleteIndexes()
  return { message: 'ok' }
}

async function deleteIndex (ctx) {
  const { indexUid } = ctx.params
  const credentials = await getCredentials()
  await meilisearch.http(meilisearch.client(credentials)).deleteIndex({
    indexUid
  })
  return { message: 'ok' }
}

async function waitForDocumentsToBeIndexed (ctx) {
  const { updateId, indexUid } = ctx.params
  const credentials = await getCredentials()
  return meilisearch.http(meilisearch.client(credentials)).waitForPendingUpdate({
    updateId, indexUid
  })
}

async function addCredentials (ctx) {
  const { host: msHost, apiKey: msApiKey } = ctx.request.body
  const store = await meilisearch.store()
  await store.setStoreKey({
    key: 'meilisearch_api_key',
    value: msApiKey
  })
  await store.setStoreKey({
    key: 'meilisearch_host',
    value: msHost
  })
  return getCredentials()
}

async function UpdateCollections (ctx) {
  const { collection: indexUid } = ctx.params
  const credentials = await getCredentials()
  const { updateId } = await meilisearch.http(meilisearch.client(credentials)).deleteAllDocuments({
    indexUid
  })
  await meilisearch.http(meilisearch.client(credentials)).waitForPendingUpdate({
    updateId, indexUid
  })
  return addCollection(ctx)
}

async function addCollectionRows (ctx) {
  const { collection } = ctx.params
  const { data } = ctx.request.body
  const credentials = await getCredentials()
  if (data.length > 0) {
    return meilisearch.http(meilisearch.client(credentials)).addDocuments({
      indexUid: collection,
      data
    })
  } else {
    return await meilisearch.http(meilisearch.client(credentials)).createIndex({
      indexUid: collection
    })
  }
}

async function fetchCollection (ctx) {
  const { collection } = ctx.params

  if (!Object.keys(strapi.services).includes(collection)) {
    return { error: true, message: 'Collection not found' }
  }
  const rows = await strapi.services[collection].find({ _publicationState: 'preview' })
  ctx.request.body = { data: rows }
  return ctx
}

async function addCollection (ctx) {
  return addCollectionRows(await fetchCollection(ctx))
}

async function getIndexes () {
  try {
    const credentials = await getCredentials()
    return await meilisearch.http(meilisearch.client(credentials)).getIndexes()
  } catch (e) {
    return []
  }
}

async function getCollections () {
  const indexes = await getIndexes()
  const hookedCollections = await getHookedCollections()
  const collections = Object.keys(strapi.services).map(collection => {
    const existInMeilisearch = !!(indexes.find(index => index.name === collection))
    return {
      name: collection,
      indexed: existInMeilisearch,
      hooked: hookedCollections.includes(collection)
    }
  })
  return { collections }
}

async function reload (ctx) {
  ctx.send('ok')
  const {
    config: { autoReload }
  } = strapi
  if (!autoReload) {
    return {
      message: 'autoReload is set to false. Please reload server manually.',
      title: 'Reload failed',
      error: true,
      link:
        'https://strapi.io/documentation/developer-docs/latest/developer-resources/cli/CLI.html#strapi-start'
    }
  } else {
    strapi.reload.isWatching = false
    strapi.reload()
    return { message: 'ok' }
  }
}

module.exports = {
  getCredentials: async (ctx) => sendCtx(ctx, getCredentials),
  addCollectionRows: async (ctx) => sendCtx(ctx, addCollectionRows),
  waitForDocumentsToBeIndexed: async (ctx) => sendCtx(ctx, waitForDocumentsToBeIndexed),
  getIndexes: async (ctx) => sendCtx(ctx, getIndexes),
  getCollections: async (ctx) => sendCtx(ctx, getCollections),
  addCollection: async (ctx) => sendCtx(ctx, addCollection),
  addCredentials: async (ctx) => sendCtx(ctx, addCredentials),
  deleteAllIndexes: async (ctx) => sendCtx(ctx, deleteAllIndexes),
  deleteIndex: async (ctx) => sendCtx(ctx, deleteIndex),
  UpdateCollections: async (ctx) => sendCtx(ctx, UpdateCollections),
  reload: async (ctx) => sendCtx(ctx, reload)
}
