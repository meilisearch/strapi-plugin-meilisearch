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

function addWatchersOnCollections({ client, collections, lifecycleService }) {
  // Add lifecyles
  collections.map(collection => {
    const model = strapi.models[collection]

    const meilisearchLifecycles = Object.keys(lifecycleService)

    model.lifecycles = model.lifecycles || {}

    meilisearchLifecycles.map(lifecycleName => {
      const fn = model.lifecycles[lifecycleName] || (() => {})
      model.lifecycles[lifecycleName] = data => {
        fn(data)
        lifecycleService[lifecycleName](data, collection, client)
      }
    })
  })
}

async function initHooks(connector, lifecycleService) {
  try {
    const credentials = await connector.resolveClientCredentials()
    let hookedCollections = await connector.getWatchedCollections()

    if (!hookedCollections) {
      hookedCollections = await connector.createWatchedCollectionsStore()
    }

    if (credentials.host && hookedCollections) {
      // Collections in Strapi
      const models = strapi.models

      // get list of Indexes In MeilISearch that are Collections in Strapi
      const indexes = await connector.getIndexUidsOfIndexedCollections(
        Object.keys(models)
      )

      addWatchersOnCollections({
        collections: indexes,
        client: connector.getClient(),
        lifecycleService,
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
  } = services()

  const connector = await Connector({
    storeService,
    meilisearchService,
    clientService,
    storeClient,
  })

  // initialize credentials from config file
  connector.updateStoreCredentials(strapi.config)

  // initialize hooks
  await initHooks(connector, lifeCycleService)
}
