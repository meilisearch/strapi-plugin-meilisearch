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

const strapiService = require('../../services/strapi')
const createStoreConnector = require('../../connectors/store')
const createMeiliSearchConnector = require('../../connectors/meilisearch')
const createCollectionConnector = require('../../connectors/collection')

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
function addWatchersOnCollections({
  collections,
  plugin,
  models,
  meilisearch,
}) {
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
        plugin.lifecycles[lifecycleName](data, collection, meilisearch)
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
async function initHooks({ store, plugin, models, services }) {
  try {
    const credentials = await store.getCredentials()

    let hookedCollections = await store.getWatchedCollections()

    if (!hookedCollections) {
      hookedCollections = await store.createWatchedCollectionsStore()
    }

    if (credentials.host && hookedCollections) {
      const collectionConnector = createCollectionConnector({
        models,
        services,
      })
      collectionConnector.validateConfigurations()
      const meilisearch = await createMeiliSearchConnector({
        collectionConnector,
        storeConnector: store,
      })

      // Get the list of indexes in MeilISearch that are collections in Strapi.
      try {
        const indexes = await meilisearch.getIndexUidsOfIndexedCollections(
          Object.keys(models)
        )

        addWatchersOnCollections({
          collections: indexes,
          plugin,
          models,
          meilisearch,
        })
        store.addWatchedCollectionToStore(indexes)
      } catch (e) {
        let message =
          e.name === 'MeiliSearchCommunicationError'
            ? `Could not connect with MeiliSearch, please check your host.`
            : `${e.name}: \n${e.message || e.code}`
        console.error(e)
        console.error(message)
      }
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
  const { plugin, storeClient, config, models, services } = strapiService()

  const store = createStoreConnector({
    plugin,
    storeClient,
  })

  // initialize credentials from config file.
  await store.updateStoreCredentials(config, store)

  // initialize hooks
  await initHooks({ store, plugin, models, services })
}
