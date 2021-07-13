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

async function getClient(credentials) {
  const client = meilisearch.client(credentials)
  return await meilisearch.http(client)
}

async function getCredentials() {
  const { plugins } = strapi.config
  if (plugins && plugins.meilisearch) {

    const apiKey = plugins.meilisearch.apiKey
    const host = plugins.meilisearch.host

    if (!apiKey.length || !host.length) {
      strapi.log.error('Meilisearch: Could not initialize: apiKey and host must be defined');
    }

    return { apiKey, host }
  } else {
    strapi.log.error('Meilisearch: Could not initialize: no plugin config found');
  }
}

function addLifecycles({ client, collections }) {
  // Add lifecyles
  collections.map(collection => {
    const model = strapi.models[collection.name]
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

async function initIndexes() {
  try {
    const credentials = await getCredentials()

    if (strapi.config.plugins.meilisearch.collections) {
      const client = await getClient(credentials)

      // Collections in Strapi
      const models = Object.keys(strapi.models)

      // Validate the collections from config
      const validCollections = strapi.config.plugins.meilisearch.collections.filter(({name, index}) => {
        if(!name) {
          strapi.log.error('Meilisearch: Invalid config: key `name` must be defined in every collection')
        } else if (!models.includes(name)) {
          strapi.log.error(`Meilisearch: Invalid config: Collection: '${name}' is not an existing collection`)
        } else if (typeof index === 'string' && !index.length) {
          strapi.log.error(`Meilisearch: Invalid config: \`index\` of collection:'${name}' isn't valid`)
        } else {
          return true;
        }
      })

      validCollections.map((collection) => {
        try {
          client.createIndex({indexUid: collection.index || collection.name});
        }
        catch (error) {

        }
      })

      addLifecycles({
        collections: validCollections,
        client,
      });
    }

    // Add collections to hooked store
  } catch (e) {
    console.error(e)
  }
}

// On refresh/build
module.exports = async () => {
  const store = strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'meilisearch_store',
  })
  strapi.plugins.meilisearch.store = store

  // initialize hooks
  await initIndexes()
}
