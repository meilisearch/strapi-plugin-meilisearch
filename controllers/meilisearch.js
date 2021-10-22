'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const createConnector = require('../connectors/connector')
const reloader = require('./utils/reloader')
const strapi = require('./../services/strapi')

async function ctxWrapper(ctx, fct) {
  try {
    const {
      plugin,
      models,
      services,
      MeiliSearchClient,
      storeClient,
    } = strapi()

    const connector = await createConnector(
      {
        plugin,
        models,
        services,
      },
      { MeiliSearchClient, storeClient }
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
  await connector.removeCollectionFromMeiliSearch(collection)
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
  return connector.waitForCollectionIndexation(collection)
}

async function addCredentials(ctx, { connector }) {
  const { host, apiKey } = ctx.request.body
  return connector.addCredentials({ host, apiKey })
}

async function updateCollections(ctx, { connector }) {
  const { collection } = ctx.params
  return connector.updateCollectionInMeiliSearch(collection)
}

async function addCollection(ctx, { connector }) {
  const { collection } = ctx.params
  await connector.addCollectionInMeiliSearch(collection)
  return { message: 'Index created' }
}

async function getCollections(_, { connector }) {
  return connector.getCollectionsReport()
}

function reload(ctx) {
  ctx.send('ok')
  return reloader()
}

module.exports = {
  getClientCredentials: async ctx => ctxWrapper(ctx, getClientCredentials),
  waitForCollectionIndexing: async ctx =>
    ctxWrapper(ctx, waitForCollectionIndexing),
  getCollections: async ctx => ctxWrapper(ctx, getCollections),
  addCollection: async ctx => ctxWrapper(ctx, addCollection),
  addCredentials: async ctx => ctxWrapper(ctx, addCredentials),
  deleteAllIndexes: async ctx => ctxWrapper(ctx, deleteAllIndexes),
  deleteIndex: async ctx => ctxWrapper(ctx, deleteIndex),
  removeCollection: async ctx => ctxWrapper(ctx, removeCollection),
  updateCollections: async ctx => ctxWrapper(ctx, updateCollections),
  reload: async ctx => ctxWrapper(ctx, reload),
}
