'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const createConnector = require('../connectors/connector')
const reloader = require('./utils/reloader')
const strapi = require('./../services/strapi')

/**
 * Wrapper around actions to propagate connector and handle errors.
 *
 * @param  {Object} ctx - Http request object
 * @param  {Function} fct - Handler that will be executed
 */
async function ctxWrapper(ctx, fct) {
  try {
    const {
      plugin,
      models,
      services,
      MeiliSearchClient,
      storeClient,
    } = strapi()

    // Create connector between SearchClient, Strapi and the Store.
    const connector = await createConnector(
      {
        plugin,
        models,
        services,
      },
      { MeiliSearchClient, storeClient }
    )
    const body = await fct(ctx, connector)
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

/**
 * Get Client Credentials from the Store.
 *
 * @param  {object} ctx - Http request object.
 * @param  {object} connector - Connector between components.
 *
 * @returns {host: string, apiKey: string}
 */
async function getClientCredentials(_, connector) {
  return connector.storedCredentials()
}

/**
 * Remove one collection indexed in MeiliSearch.
 *
 * @param  {object} ctx - Http request object.
 * @param  {object} connector - Connector between components.
 *
 * @returns {message: 'ok'}
 */
async function removeCollection(ctx, connector) {
  const { collection } = ctx.params
  await connector.removeCollectionFromMeiliSearch(collection)
  return { message: 'ok' }
}

// TODO only delete when not composite
// or if composite only has one collection

/**
 * Wait for one collection to be completely indexed in MeiliSearch.
 *
 * @param  {object} ctx - Http request object.
 * @param  {object} connector - Connector between components.
 *
 * @returns { numberOfDocumentsIndexed: number }
 */
async function waitForCollectionIndexing(ctx, connector) {
  const { collection } = ctx.params
  return connector.waitForCollectionIndexation(collection)
}

/**
 * Add MeiliSearch Credentials to the Store.
 *
 * @param  {object} ctx - Http request object.
 * @param  {object} connector - Connector between components.
 *
 * @return {{ host: string, apiKey: string}} - Credentials
 */
async function addCredentials(ctx, connector) {
  const { host, apiKey } = ctx.request.body
  return connector.addCredentials({ host, apiKey })
}

/**
 * Remove and re-index a collection in MeiliSearch.
 *
 * @param  {object} ctx - Http request object.
 * @param  {object} connector - Connector between components.
 *
 * @returns {number[]} - All updates id from the indexation process.
 */
async function updateCollections(ctx, connector) {
  const { collection } = ctx.params
  return connector.updateCollectionInMeiliSearch(collection)
}

/**
 * Add a collection to MeiliSearch.
 *
 * @param  {object} ctx - Http request object.
 * @param  {object} connector - Connector between components.
 *
 * @returns {number[]} - All updates id from the batched indexation process.
 */
async function addCollection(ctx, connector) {
  const { collection } = ctx.params
  await connector.addCollectionInMeiliSearch(collection)
  return { message: 'Index created' }
}

/**
 * Get extended information about collections in MeiliSearch.
 *
 * @param  {object} ctx - Http request object.
 * @param  {object} connector - Connector between components.
 */
async function getCollections(_, connector) {
  return connector.getCollectionsReport()
}

/**
 * Reloads the server. Only works in development mode.
 *
 * @param  {object} ctx - Http request object.
 * @param  {object} connector - Connector between components.
 */
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
  removeCollection: async ctx => ctxWrapper(ctx, removeCollection),
  updateCollections: async ctx => ctxWrapper(ctx, updateCollections),
  reload: async ctx => ctxWrapper(ctx, reload),
}
