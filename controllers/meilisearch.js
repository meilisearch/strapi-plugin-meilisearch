'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const credentialsService = () => strapi.plugins.meilisearch.services.credentials_store
const meiliSearchService = () => strapi.plugins.meilisearch.services.meilisearch

async function errorHandler (f) {
  return async function () {
    try {
      return await f.apply(this, arguments)
    } catch (e) {
      console.error(e)
      return {
        error: true,
        message: `${e.type}: \n${e.message || e.code}`,
        ...(e.errorLink ? { link: e.errorLink } : {})
      }
    }
  }
}

async function sendCtx (ctx, fct) {
  const wrapped = await errorHandler(fct)
  const body = await wrapped(ctx)
  ctx.send(body)
}

async function getCredentials () {
  return credentialsService().getMeiliSearchCredentials()
}

async function deleteAllIndexes () {
  const config = await getCredentials()
  await meiliSearchService().deleteIndexes({
    config
  })
  return { message: 'ok' }
}

async function deleteIndex (ctx) {
  const { indexUid } = ctx.params
  const config = await getCredentials()
  await meiliSearchService().deleteIndex({
    config, indexUid
  })
  return { message: 'ok' }
}

async function waitForDocumentsToBeIndexed (ctx) {
  const { updateId, indexUid } = ctx.params
  const config = await getCredentials()
  return meiliSearchService().waitForPendingUpdate({
    config, updateId, indexUid
  })
}

async function addCredentials (ctx) {
  const { host: msHost, apiKey: msApiKey } = ctx.request.body
  await credentialsService().setStoreKey({
    key: 'meilisearchApiKey',
    value: msApiKey
  })
  await credentialsService().setStoreKey({
    key: 'meilisearchHost',
    value: msHost
  })
  return getCredentials()
}

async function addDocuments (ctx) {
  const { indexUid } = ctx.params
  const { data } = ctx.request.body
  const config = await getCredentials()

  return meiliSearchService().addDocuments({
    config,
    indexUid,
    data
  })
}

async function addCollection (ctx) {
  const { indexUid } = ctx.request.body
  if (!Object.keys(strapi.services).includes(indexUid)) {
    return { error: true, message: 'Collection not found' }
  }
  const rows = await strapi.services[indexUid].find()
  ctx.params.indexUid = indexUid
  ctx.request.body = { data: rows }
  return addDocuments(ctx)
}

async function getIndexes () {
  const config = await getCredentials()
  return meiliSearchService().getIndexes({ config })
}

async function getCollections () {
  const indexes = await getIndexes()
  const collections = Object.keys(strapi.services).map(service => {
    const existInMeiliSearch = !!(indexes.find(index => index.name === service))
    return {
      name: service,
      status: (existInMeiliSearch) ? 'processed' : 'Not in MeiliSearch',
      indexed: existInMeiliSearch
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
