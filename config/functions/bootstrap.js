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
 * Add listeners on collection that are indexed in MeiliSearch.
 * Listeners updates automatically collection's in MeiliSearch.
 * A listener is triggered with: ADD/UPDATE/DELETE actions.
 *
 * @param  {object} strapi - Strapi Services.
 * @param  {string[]} strapi.collections - All collections present in MeiliSearch.
 * @param  {object} strapi.plugin - MeiliSearch Plugins services.
 * @param  {object} strapi.models - Collections models.
 * @param  {object} strapi.connector - Plugin connector.
 */
function addListenerOnCollection({ collections, plugin, models, meilisearch }) {
  // Iterate on all collections present in MeilISearch
  collections.map(collection => {
    const model = models[collection]

    // Fetches all lifecycles that are listened by the plugin.
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
 * Initialise listener based on collections presence in MeiliSearch and in the listener store.
 *
 * @param  {object} connector - Plugin connector.
 * @param  {object} plugin - MeiliSearch Plugins services.
 * @param  {object} models - Collections models.
 */
async function addListeners({ store, plugin, models, services, logger }) {
  try {
    const credentials = await store.getCredentials()

    if (credentials.host) {
      const collectionConnector = createCollectionConnector({
        models,
        services,
        logger,
      })
      const meilisearch = await createMeiliSearchConnector({
        collectionConnector,
        storeConnector: store,
      })

      // Get the list of indexes in MeiliSearch that are collections in Strapi.
      try {
        // When a Collection is added to MeiliSearch, it is also added in the store.
        // this fetches the collection indexed in the store
        const storedCollections = await store.getIndexedCollections()

        // This is an union of the indexes in MeiliSearch and all the collections in Strapi.
        const indexedCollections = await meilisearch.getCollectionsIndexedInMeiliSearch(
          Object.keys(models)
        )

        // collections are the union of the indexes in MeiliSearch and the collection
        // from the `indexed-in-meilisearch` store.
        const collections = indexedCollections.filter(col =>
          storedCollections.includes(col)
        )

        // Each collections that are both in MeiliSearch and in the stored collections
        // become listened in order to update MeiliSearch on every change in the collection.
        addListenerOnCollection({
          collections,
          plugin,
          models,
          meilisearch,
        })

        // Add collection the list of listened collections in the store.
        await store.setListenedCollections(collections)
      } catch (e) {
        let message =
          e.name === 'MeiliSearchCommunicationError'
            ? `Could not connect with MeiliSearch, please check your host.`
            : `${e.name}: \n${e.message || e.code}`
        console.error(message)
      }
    }
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
    storeClient,
    config,
    models,
    services,
    logger,
  } = strapiService()

  const store = createStoreConnector({
    plugin,
    storeClient,
  })

  // initialize credentials from config file.
  await store.updateStoreCredentials(config, store)

  // add listeners to collections.
  await addListeners({ store, plugin, models, services, logger })
}
