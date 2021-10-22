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
const Connector = require('../../services/connector')

function addWatchersOnCollections({
  collections,
  lifecycleService,
  models,
  connector,
}) {
  // Add lifecyles
  collections.map(collection => {
    const model = models[collection]

    const meilisearchLifecycles = Object.keys(lifecycleService)

    model.lifecycles = model.lifecycles || {}

    meilisearchLifecycles.map(lifecycleName => {
      const fn = model.lifecycles[lifecycleName] || (() => {})
      model.lifecycles[lifecycleName] = data => {
        fn(data)
        lifecycleService[lifecycleName](data, collection, connector)
      }
    })
  })
}

async function initHooks(connector, lifecycleService, models) {
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
        lifecycleService,
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
    clientService,
    storeClient,
    lifeCycleService,
    pluginConfig,
    models,
  } = services()

  const connector = await Connector({
    storeService,
    meilisearchService,
    clientService,
    storeClient,
    models,
  })

  // initialize credentials from config file
  connector.updateStoreCredentials(pluginConfig, models)

  // initialize hooks
  await initHooks(connector, lifeCycleService, models)
}
