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

const services = require('../../services/strapi')
const createConnector = require('../../services/connectors')

function addWatchersOnCollections({
  collections,
  lifeCycles,
  models,
  connector,
}) {
  // Add lifecyles
  collections.map(collection => {
    const model = models[collection]

    const meilisearchLifecycles = Object.keys(lifeCycles)

    model.lifecycles = model.lifecycles || {}

    meilisearchLifecycles.map(lifecycleName => {
      const fn = model.lifecycles[lifecycleName] || (() => {})
      model.lifecycles[lifecycleName] = data => {
        fn(data)
        lifeCycles[lifecycleName](data, collection, connector)
      }
    })
  })
}

async function initHooks(connector, lifeCycles, models) {
  try {
    const credentials = await connector.resolveClientCredentials()
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
        lifeCycles,
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

// On refresh/build
module.exports = async () => {
  const {
    storeService,
    meilisearchService,
    MeiliSearchClient,
    storeClient,
    lifeCycles,
    pluginConfig,
    models,
    strapiServices,
  } = services()

  const connector = await createConnector({
    storeService,
    meilisearchService,
    MeiliSearchClient,
    storeClient,
    models,
    strapiServices,
  })

  // initialize credentials from config file
  connector.updateStoreCredentials(pluginConfig, models)

  // initialize hooks
  await initHooks(connector, lifeCycles, models)
}
