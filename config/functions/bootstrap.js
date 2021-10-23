'use strict'

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/concepts/configurations.html#bootstrap
 */

const strapi = require('../../services/strapi')
const createConnector = require('../../connectors/connector')

/**
 * Add watchers on collection that are indexed in MeiliSearch.
 * Watchers updates automatically collection's in MeiliSearch.
 * A watcher is triggered with: ADD/UPDATE/DELETE actions.
 *
 * @param  {object} strapi - Strapi Services.
 * @param  {string[]} strapi.collections - All collections present in MeiliSearch.
 * @param  {object} strapi.plugin - MeiliSearch Plugins services.
 * @param  {object} strapi.models - Collections models.
 * @param  {object} strapi.connector - Plugin connector.
 */
function addWatchersOnCollections({ collections, plugin, models, connector }) {
  // Iterate on all collections present in MeilISearch
  collections.map(collection => {
    const model = models[collection]

    // Fetches all lifecycles that are watched by the plugin.
    const lifeCyclesNames = Object.keys(plugin.lifecycles)

    // Create default lifecycle empty object if no lifecycles functions are found.
    model.lifecycles = model.lifecycles || {}

    // Add lifecycles functions to the collection.
    lifeCyclesNames.map(lifecycleName => {
      const fn = model.lifecycles[lifecycleName] || (() => {})
      model.lifecycles[lifecycleName] = data => {
        fn(data)
        plugin.lifecycles[lifecycleName](data, collection, connector)
      }
    })
  })
}

/**
 * Initialise hooks based on collections presence in MeiliSearch and in the hooks store.
 *
 * @param  {object} connector - Plugin connector.
 * @param  {object} plugin - MeiliSearch Plugins services.
 * @param  {object} models - Collections models.
 */
async function initHooks(connector, plugin, models) {
  try {
    const credentials = await connector.storedCredentials()
    let hookedCollections = await connector.getWatchedCollections()

    if (!hookedCollections) {
      hookedCollections = await connector.createWatchedCollectionsStore()
    }

    if (credentials.host && hookedCollections) {
      // get list of Indexes In MeilISearch that are Collections in Strapi
      const indexes = await connector.getIndexUidsOfIndexedCollections(
        Object.keys(models)
      )

      addWatchersOnCollections({
        collections: indexes,
        plugin,
        models,
        connector,
      })
      connector.addWatchedCollectionToStore(indexes)
    }

    // Add collections to hooked store
  } catch (e) {
    console.error(e)
  }
}

/**
 * Bootstrap function runned on every server reload.
 *
 */
module.exports = async () => {
  const {
    plugin,
    MeiliSearchClient,
    storeClient,
    config,
    models,
    services,
  } = strapi()

  const connector = await createConnector(
    {
      plugin,
      models,
      services,
    },
    { MeiliSearchClient, storeClient }
  )

  // initialize credentials from config file.
  connector.updateStoreCredentials(config, models)

  // initialize hooks
  await initHooks(connector, plugin, models)
}
