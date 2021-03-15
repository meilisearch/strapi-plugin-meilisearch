'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const meilisearch = {
  http: (client) => strapi.plugins.meilisearch.services.meilisearch_http(client),
  client: (credentials) => strapi.plugins.meilisearch.services.meilisearch_client(credentials),
  store: () => strapi.plugins.meilisearch.services.plugin_store('meilisearchCredentials')
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
  const apiKey = await meilisearch.store().getStoreKey('meilisearchApiKey')
  const host = await meilisearch.store().getStoreKey('meilisearchHost')
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

async function addDocuments (ctx) {
  const { indexUid } = ctx.params
  const { data } = ctx.request.body
  const credentials = await getCredentials()
  //
  data.map(document => {
    delete document.updated_by
    delete document.created_by
    return document
  })

  return meilisearch.http(meilisearch.client(credentials)).addDocuments({
    indexUid,
    data
  })
}

async function addCollection (ctx) {
  const { indexUid } = ctx.request.body
  if (!Object.keys(strapi.services).includes(indexUid)) {
    return { error: true, message: 'Collection not found' }
  }
  const rows = await strapi.services[indexUid].find({ _publicationState: 'preview' })
  ctx.params.indexUid = indexUid
  ctx.request.body = { data: rows }
  return addDocuments(ctx)
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
  addDocuments: async (ctx) => sendCtx(ctx, addDocuments),
  waitForDocumentsToBeIndexed: async (ctx) => sendCtx(ctx, waitForDocumentsToBeIndexed),
  getIndexes: async (ctx) => sendCtx(ctx, getIndexes),
  getCollections: async (ctx) => sendCtx(ctx, getCollections),
  addCollection: async (ctx) => sendCtx(ctx, addCollection),
  addCredentials: async (ctx) => sendCtx(ctx, addCredentials),
  deleteAllIndexes: async (ctx) => sendCtx(ctx, deleteAllIndexes),
  deleteIndex: async (ctx) => sendCtx(ctx, deleteIndex)
}
