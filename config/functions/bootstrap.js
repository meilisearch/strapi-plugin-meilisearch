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

function addWatchersOnCollections({ collections, plugin, models, connector }) {
  // Add lifecyles
  collections.map(collection => {
    const model = models[collection]

    const lifeCyclesNames = Object.keys(plugin.lifecycles)

    model.lifecycles = model.lifecycles || {}

    lifeCyclesNames.map(lifecycleName => {
      const fn = model.lifecycles[lifecycleName] || (() => {})
      model.lifecycles[lifecycleName] = data => {
        fn(data)
        plugin.lifecycles[lifecycleName](data, collection, connector)
      }
    })
  })
}

async function initHooks(connector, plugin, models) {
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

// On refresh/build
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

  // initialize credentials from config file
  connector.updateStoreCredentials(config, models)

  // initialize hooks
  await initHooks(connector, plugin, models)
}
