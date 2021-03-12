'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const meilisearch = {
  http: () => strapi.plugins.meilisearch.services.meilisearch_http,
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
  await meilisearch.http().deleteIndexes({
    client: meilisearch.client(credentials)
  })
  return { message: 'ok' }
}

async function deleteIndex (ctx) {
  const { indexUid } = ctx.params
  const credentials = await getCredentials()
  await meilisearch.http().deleteIndex({
    client: meilisearch.client(credentials), indexUid
  })
  return { message: 'ok' }
}

async function waitForDocumentsToBeIndexed (ctx) {
  const { updateId, indexUid } = ctx.params
  const credentials = await getCredentials()
  return meilisearch.http().waitForPendingUpdate({
    client: meilisearch.client(credentials), updateId, indexUid
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

  return meilisearch.http().addDocuments({
    client: meilisearch.client(credentials),
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
    return await meilisearch.http().getIndexes({
      client: meilisearch.client(credentials)
    })
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
