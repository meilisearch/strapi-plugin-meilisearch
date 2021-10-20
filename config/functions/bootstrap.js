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

const { getIndexName } = require('../../services/indexes')

const meilisearch = {
  http: client => strapi.plugins.meilisearch.services.http(client),
  client: credentials =>
    strapi.plugins.meilisearch.services.client(credentials),
  store: () => strapi.plugins.meilisearch.services.store,
  lifecycles: () => strapi.plugins.meilisearch.services.lifecycles,
}

async function getClient(credentials) {
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

function addHookedCollectionsToStore({ store, collections }) {
  store.set({
    key: 'meilisearch_hooked',
    value: collections,
  })
}

async function getHookedCollectionsFromStore({ store }) {
  return store.get({ key: 'meilisearch_hooked' })
}

async function createHookedCollection({ store }) {
  return store.set({ key: 'meilisearch_hooked', value: [] })
}

function addLifecycles({ client, collections }) {
  // Add lifecyles
  collections.map(collection => {
    const model = strapi.models[collection]
    const meilisearchLifecycles = Object.keys(meilisearch.lifecycles())
    model.lifecycles = model.lifecycles || {}

    meilisearchLifecycles.map(lifecycleName => {
      const fn = model.lifecycles[lifecycleName] || (() => {})
      model.lifecycles[lifecycleName] = data => {
        fn(data)
        meilisearch.lifecycles()[lifecycleName](data, collection, client)
      }
    })
  })
}

async function initHooks(store) {
  try {
    const credentials = await getCredentials()
    const hookedCollections =
      (await getHookedCollectionsFromStore({ store })) ||
      (await createHookedCollection({ store }))

    if (credentials.host && hookedCollections) {
      const client = await getClient(credentials)
      // get list of indexes in MeiliSearch Instance
      const indexes = (await getIndexes(client)).map(index => index.uid)

      // Collections in Strapi
      const models = strapi.models

      // get list of Indexes In MeilISearch that are Collections in Strapi
      const indexedCollections = Object.keys(models).filter(model =>
        indexes.includes(getIndexName(model))
      )
      addLifecycles({
        collections: indexedCollections,
        client,
      })
      addHookedCollectionsToStore({
        collections: indexedCollections,
        store,
      })
    }

    // Add collections to hooked store
  } catch (e) {
    console.error(e)
  }
}

async function updateStoreCredentials({ store }) {
  // optional chaining is not natively supported by node 12.
  let apiKey = false
  let host = false
  const { plugins } = strapi.config
  if (plugins && plugins.meilisearch) {
    apiKey = plugins.meilisearch.apiKey
    host = plugins.meilisearch.host
  }

  if (apiKey) {
    await store.set({
      key: 'meilisearch_api_key',
      value: apiKey,
    })
  }
  await store.set({
    key: 'meilisearch_api_key_config',
    value: !!apiKey,
  })

  if (host) {
    await store.set({
      key: 'meilisearch_host',
      value: host,
    })
  }
  await store.set({
    key: 'meilisearch_host_config',
    value: !!host,
  })
}

// On refresh/build
module.exports = async () => {
  const store = strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'meilisearch_store',
  })
  strapi.plugins.meilisearch.store = store

  // initialize credentials from config file
  await updateStoreCredentials({ store })

  // initialize hooks
  await initHooks(store)
}
