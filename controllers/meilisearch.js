'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const createStoreConnector = require('../connectors/store')
const createMeiliSearchConnector = require('../connectors/meilisearch')
const createCollectionConnector = require('../connectors/collection')
const reloader = require('./utils/reloader')
const strapi = require('./../services/strapi')

async function createConnector() {
  const { plugin, models, services, storeClient, logger } = strapi()
  const storeConnector = createStoreConnector({ plugin, storeClient })

  const collectionConnector = createCollectionConnector({
    logger,
    services,
    models,
  })

  // Create plugin connector.
  return await createMeiliSearchConnector({
    collectionConnector,
    storeConnector,
  })
}

/**
 * Wrapper around actions to propagate connector and handle errors.
 *
 * @param  {Object} ctx - Http request object
 * @param  {Function} fct - Handler that will be executed
 *
 * @returns {ctx} - response object
 */
async function ctxWrapper(ctx, fct) {
  try {
    const body = await fct(ctx)
    ctx.send(body)
  } catch (e) {
    console.error(e)
    const message =
      e.name === 'MeiliSearchCommunicationError'
        ? `Could not connect with MeiliSearch, please check your host.`
        : `${e.name}: \n${e.message || e.code}`
    return {
      error: true,
      message,
      link: e.errorLink,
    }
  }
}

/**
 * Get Client Credentials from the Store.
 *
 * @returns {{host: string, apiKey: string}}
 */
async function getClientCredentials() {
  const { plugin, storeClient } = strapi()
  const store = createStoreConnector({ plugin, storeClient })
  return store.getCredentials()
}

/**
 * Remove one collection indexed in MeiliSearch.
 *
 * @param  {object} ctx - Http request object.
 *
 * @returns {message: 'ok'}
 */
async function removeCollection(ctx) {
  const connector = await createConnector()
  const { collection } = ctx.params
  return connector.removeCollectionFromMeiliSearch(collection)
}

/**
 * Get extended information about collections in MeiliSearch.
 *
 * @param  {object} ctx - Http request object.
 *
 * @returns {object[]} - List of collections reports.
 */
async function getCollections() {
  const connector = await createConnector()
  return connector.getCollectionsReport()
}

/**
 * Add MeiliSearch Credentials to the Store.
 *
 * @param  {object} ctx - Http request object.
 *
 * @return {{ host: string, apiKey: string}} - Credentials
 */
async function addCredentials(ctx) {
  const { plugin, storeClient } = strapi()
  const store = createStoreConnector({ plugin, storeClient })
  const { host, apiKey } = ctx.request.body
  return store.addCredentials({ host, apiKey })
}

/**
 * Remove and re-index a collection in MeiliSearch.
 *
 * @param  {object} ctx - Http request object.
 *
 * @returns {{ message: string, taskUids: number[] }} - All tasks uid from the indexation process.
 */
async function updateCollections(ctx) {
  const connector = await createConnector()
  const { collection } = ctx.params
  const taskUids = await connector.updateCollectionInMeiliSearch(collection)
  return { message: 'Index created', taskUids }
}

/**
 * Add a collection to MeiliSearch.
 *
 * @param  {object} ctx - Http request object.
 *
 * @returns {number[]} - All task uids from the batched indexation process.
 */
async function addCollection(ctx) {
  const connector = await createConnector()
  const { collection } = ctx.params
  const taskUids = await connector.addCollectionInMeiliSearch(collection)
  return { message: 'Index created', taskUids }
}

/**
 * Wait for one collection to be completely indexed in MeiliSearch.
 *
 * @param  {object} ctx - Http request object.
 *
 * @returns { numberOfDocumentsIndexed: number }
 */
async function waitForTasks(ctx) {
  const connector = await createConnector()
  const { collection } = ctx.params
  const { taskUids } = ctx.request.body
  const tasksStatus = await connector.waitForTasks({
    taskUids,
    collection,
  })
  return { tasksStatus }
}

/**
 * Wait for one collection to be completely indexed in MeiliSearch.
 *
 * @returns { taskUids: number[] }
 */
async function getTaskUids() {
  const connector = await createConnector()
  const taskUids = await connector.getTaskUids()

  return { taskUids }
}

/**
 * Reloads the server. Only works in development mode.
 *
 * @param  {object} ctx - Http request object.
 */
function reload(ctx) {
  ctx.send('ok')
  return reloader()
}

module.exports = {
  getClientCredentials: async ctx => ctxWrapper(ctx, getClientCredentials),
  getCollections: async ctx => ctxWrapper(ctx, getCollections),
  addCollection: async ctx => ctxWrapper(ctx, addCollection),
  addCredentials: async ctx => ctxWrapper(ctx, addCredentials),
  removeCollection: async ctx => ctxWrapper(ctx, removeCollection),
  updateCollections: async ctx => ctxWrapper(ctx, updateCollections),
  waitForTasks: async ctx => ctxWrapper(ctx, waitForTasks),
  getTaskUids: async ctx => ctxWrapper(ctx, getTaskUids),
  reload: async ctx => ctxWrapper(ctx, reload),
}
