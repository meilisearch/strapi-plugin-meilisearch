'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const Connector = require('./../services/connector')
const services = require('./../services/strapi')

async function sendCtx(ctx, fct) {
  try {
    const { storeService, meilisearchService, clientService } = services()
    const connector = await Connector(
      clientService,
      meilisearchService,
      storeService
    )
    const body = await fct(ctx, {
      connector,
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

async function getClientCredentials(ctx, { connector }) {
  return connector.resolveClientCredentials()
}

async function deleteAllIndexes(ctx, { connector }) {
  await connector.meilisearch.deleteIndexes()
  return { message: 'ok' }
}

async function removeCollection(ctx, { connector }) {
  const { collection } = ctx.params
  await connector.removeCollection(collection)
  return { message: 'ok' }
}

// TODO only delete when not composite
// or if composite only has one collection
async function deleteIndex(ctx, { connector }) {
  const { collection } = ctx.params
  await connector.deleteIndex(collection)
  return { message: 'ok' }
}

async function waitForCollectionIndexing(ctx, { connector }) {
  const { collection } = ctx.params
  return connector.waitForIndexation(collection)
}

async function addCredentials(ctx, { connector }) {
  const { host, apiKey } = ctx.request.body
  return connector.addCredentials({ host, apiKey })
}

async function updateCollections(ctx, { connector }) {
  const { collection } = ctx.params
  return connector.updateCollection(collection)
}

async function addCollection(ctx, { connector }) {
  const { collection } = ctx.params
  connector.addCollection(collection)
  return { message: 'Index created' }
}

async function getCollections(_, { connector }) {
  return connector.getCollections()
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
  getClientCredentials: async ctx => sendCtx(ctx, getClientCredentials),
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
}
