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

const meilisearch = {
  http: client => strapi.plugins.meilisearch.services.http(client),
  client: credentials =>
    strapi.plugins.meilisearch.services.client(credentials),
  store: () => strapi.plugins.meilisearch.services.store,
  lifecycles: () => strapi.plugins.meilisearch.services.lifecycles,
}

async function getClient (credentials) {
  const client = meilisearch.client(credentials)
  return await meilisearch.http(client)
}

async function getIndexes(client) {
  try {
    return client.getIndexes()
  } catch (e) {
    return []
  }
}

async function getCredentials() {
  const store = await meilisearch.store()
  const apiKey = await store.getStoreKey('meilisearch_api_key')
  const host = await store.getStoreKey('meilisearch_host')
  return { apiKey, host }
}

function addHookedCollectionsToStore ({ store, collections }) {
  store.set({
    key: 'meilisearch_hooked',
    value: collections
  })
}

async function getHookedCollectionsFromStore ({ store }) {
  return store.get({ key: 'meilisearch_hooked' })
}

function addLifecycles ({ client, collections }) {
  // Add lifecyles
  collections.map(collection => {
    const model = strapi.models[collection]
    const meilisearchLifecycles = Object.keys(meilisearch.lifecycles())
    model.lifecycles = model.lifecycles || {}

    meilisearchLifecycles.map(lifecycleName => {
      const fn = model.lifecycles[lifecycleName] || (() => {})
      model.lifecycles[lifecycleName] = (data) => {
        fn(data)
        meilisearch.lifecycles()[lifecycleName](data, collection, client)
      }
    })
  })
}

async function initHooks (store) {
  try {
    const credentials = await getCredentials()
    const getHookedCollections = await getHookedCollectionsFromStore({ store })
    // If hooked collection is not found it means that no MeiliSearch
    // Indexes are to be hooked. Meaning we do not have to add any lifecycle.
    if (credentials.host && getHookedCollections) {
      const client = await getClient(credentials)
      // get list of indexes in MeiliSearch Instance
      const indexes = (await getIndexes(client)).map(index => index.uid)

      // Collections in Strapi
      const models = strapi.models

      // get list of Indexes In MeilISearch that are Collections in Strapi
      const indexedCollections = Object.keys(models).filter(model => indexes.includes(model))
      addLifecycles({
        collections: indexedCollections,
        client
      })
      addHookedCollectionsToStore({
        collections: indexedCollections,
        store
      })
    }

    // Add collections to hooked store
  } catch (e) {
    console.error(e)
  }
}

module.exports = async () => {
  const store = strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'meilisearch_store',
  })
  strapi.plugins.meilisearch.store = store

  await initHooks(store)
}
