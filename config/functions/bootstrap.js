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
  http: (client) => strapi.plugins.meilisearch.services.http(client),
  client: (credentials) => strapi.plugins.meilisearch.services.client(credentials),
  store: () => strapi.plugins.meilisearch.services.store,
  lifecycles: () => strapi.plugins.meilisearch.services.lifecycles
}

async function getIndexes () {
  try {
    const credentials = await getCredentials()
    const client = meilisearch.client(credentials)
    return await meilisearch.http(client).getIndexes()
  } catch (e) {
    return []
  }
}

async function getCredentials () {
  const store = await meilisearch.store()
  const apiKey = await store.getStoreKey('meilisearchApiKey')
  const host = await store.getStoreKey('meilisearchHost')
  return { apiKey, host }
}

async function initHooks (store) {
  const models = strapi.models
  const indexes = (await getIndexes()).map(index => index.uid)
  const indexed = Object.keys(models).filter(model => indexes.includes(model))

  indexed.map(collection => {
    const model = strapi.models[collection]
    const meilisearchLifecycles = Object.keys(meilisearch.lifecycles())
    model.lifecycles = model.lifecycles || {}

    meilisearchLifecycles.map(lifecycleName => {
      const fn = model.lifecycles[lifecycleName] || (() => {})
      model.lifecycles[lifecycleName] = (data) => {
        fn(data)
        meilisearch.lifecycles()[lifecycleName](data, collection)
      }
    })
  })
  store.set({
    key: 'meilisearch_hooked',
    value: indexed
  })
}

module.exports = async () => {
  const store = strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'meilisearch_store'
  })
  strapi.plugins.meilisearch.store = store

  await initHooks(store)
}
