'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const meilisearch = {
  http: (client) => strapi.plugins.meilisearch.services.meilisearch_http(client),
  client: (credentials) => strapi.plugins.meilisearch.services.meilisearch_client(credentials),
  store: async () => strapi.plugins.meilisearch.services.plugin_store('meilisearchCredentials'),
  lifecycle: () => strapi.plugins.meilisearch.services.lifecyles_files
}

async function sendCtx (ctx, fct) {
  try {
    const body = await fct(ctx)
    ctx.send(body)
  } catch (e) {
    console.error(e)
    return {
      error: true,
      message: `${e.type}: \n${e.message || e.code}`,
      ...(e.errorLink ? { link: e.errorLink } : {})
    }
  }
}

async function getCredentials () {
  const apiKey = await (await meilisearch.store()).getStoreKey('meilisearchApiKey')
  const host = await (await meilisearch.store()).getStoreKey('meilisearchHost')
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
  await meilisearch.store().setStoreKey({
    key: 'meilisearchApiKey',
    value: msApiKey
  })
  await meilisearch.store().setStoreKey({
    key: 'meilisearchHost',
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
  console.log(ctx.params)
  const { collection } = ctx.params
  const { data } = ctx.request.body
  const credentials = await getCredentials()
  return meilisearch.http(meilisearch.client(credentials)).addDocuments({
    indexUid: collection,
    data
  })
}

async function fetchCollection (ctx) {
  console.log('FETCH', ctx.params)
  const { collection } = ctx.params

  if (!Object.keys(strapi.services).includes(collection)) {
    return { error: true, message: 'Collection not found' }
  }
  const rows = await strapi.services[collection].find({ _publicationState: 'preview' })
  ctx.request.body = { data: rows }
  return ctx
}

async function addCollection (ctx) {
  console.log('ADD COL', ctx.params)
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
  const collections = Object.keys(strapi.services).map(service => {
    const existInMeilisearch = !!(indexes.find(index => index.name === service))
    if (existInMeilisearch) meilisearch.lifecycle(service)
    return {
      name: service,
      status: (existInMeilisearch) ? 'processed' : 'Not in Meilisearch',
      indexed: existInMeilisearch
    }
  })
  return { collections }
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
  UpdateCollections: async (ctx) => sendCtx(ctx, UpdateCollections)
}
