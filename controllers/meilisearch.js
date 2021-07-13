'use strict'

/**
 * meilisearch.js controller
 *
 * @description: A set of functions called "actions" of the `meilisearch` plugin.
 */

const meilisearch = {
  http: client => strapi.plugins.meilisearch.services.http(client),
  client: credentials =>
    strapi.plugins.meilisearch.services.client(credentials),
  store: () => strapi.plugins.meilisearch.services.store,
  lifecycles: () => strapi.plugins.meilisearch.services.lifecycles,
}

async function sendCtx(ctx, fct) {
  try {
    const body = await fct(ctx)
    ctx.send(body)
  } catch (e) {
    console.error(e)
    const message =
      e.name === 'MeiliSearchCommunicationError'
        ? `Could not connect with MeiliSearch ${e.code}`
        : `${e.name}: \n${e.message || e.code}`
    return {
      error: true,
      message,
      link: e.errorLink,
    }
  }
}

async function getHookedCollections() {
  const store = await meilisearch.store()
  const hookedCollections = await store.getStoreKey('meilisearch_hooked')
  return hookedCollections || []
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

async function deleteAllIndexes() {
  const credentials = await getCredentials()
  await meilisearch.http(meilisearch.client(credentials)).deleteIndexes()
  return { message: 'ok' }
}

async function deleteIndex(ctx) {
  const { indexUid } = ctx.params
  const credentials = await getCredentials()
  await meilisearch.http(meilisearch.client(credentials)).deleteIndex({
    indexUid,
  })
  return { message: 'ok' }
}

async function waitForDocumentsToBeIndexed(ctx) {
  const { indexUid } = ctx.params
  const collection = strapi.config.plugins.meilisearch.collections.find(item => item.name === indexUid);

  const credentials = await getCredentials()
  const numberOfDocuments = await meilisearch
    .http(meilisearch.client(credentials))
    .waitForPendingUpdates({
      indexUid: collection.index || collection.name,
      updateNbr: 2,
    })
  return { numberOfDocuments }
}

async function addCredentials(ctx) {
  const { configFileApiKey, configFileHost } = await getCredentials()
  const { host: msHost, apiKey: msApiKey } = ctx.request.body
  const store = await meilisearch.store()
  if (!configFileApiKey) {
    await store.setStoreKey({
      key: 'meilisearch_api_key',
      value: msApiKey,
    })
  }
  if (!configFileHost) {
    await store.setStoreKey({
      key: 'meilisearch_host',
      value: msHost,
    })
  }
  return getCredentials()
}

async function UpdateCollections(ctx) {
  let { collection } = ctx.params
  collection = strapi.config.plugins.meilisearch.collections.find(item => item.name === collection);

  const credentials = await getCredentials()
  const { updateId } = await meilisearch
    .http(meilisearch.client(credentials))
    .deleteAllDocuments({
      indexUid: collection.index || collection.name,
    })
  await meilisearch.http(meilisearch.client(credentials)).waitForPendingUpdate({
    updateId,
    indexUid: collection.index || collection.name,
  })
  return addCollection(ctx)
}

async function indexDocuments({ documents = [], collection }) {
  const credentials = await getCredentials()
  if (documents.length > 0) {
    return meilisearch.http(meilisearch.client(credentials)).addDocuments({
      indexUid: collection,
      data: documents,
    })
  }
}

async function fetchRowBatch({ start, limit, collection }) {
  return strapi.services[collection].find({
    _publicationState: 'preview',
    _limit: limit,
    _start: start,
  })
}

function getCollectionTypes() {
  const services = strapi.services
  return Object.keys(services).filter(type => {
    return services[type].count
  })
}

async function numberOfRowsInCollection({ collection }) {
  return (
    strapi.services[collection].count &&
    strapi.services[collection].count({ _publicationState: 'preview' })
  )
}

async function batchAddCollection(ctx) {
  let { collection } = ctx.params
  collection = strapi.config.plugins.meilisearch.collections.find(item => item.name === collection);
  const index = collection.index || collection.name

  for (const i in strapi.config.plugins.meilisearch.collections) {
    const item = strapi.config.plugins.meilisearch.collections[i]

    if(index === (item.index || item.name)){
      console.log(item);
      const count = await numberOfRowsInCollection({ collection: item.name })
      const BATCH_SIZE = 1000
      const updateIds = []
      for (let index = 0; index <= count; index += BATCH_SIZE) {
        const rows = await fetchRowBatch({
          start: index,
          limit: BATCH_SIZE,
          collection: item.name,
        })

        const { updateId } = await indexDocuments({ collection: item.index || item.name, documents: rows.map(row => ({...row, id: item.name + row.id })) })
        if (updateId) updateIds.push(updateId)
      }
    }
  }
}

async function addCollection(ctx) {
  let { collection } = ctx.params
  collection = strapi.config.plugins.meilisearch.collections.find(item => item.name === collection);

  const credentials = await getCredentials()
  // Create collection in MeiliSearch
  await meilisearch.http(meilisearch.client(credentials)).createIndex({
    indexUid: collection.index || collection.name,
  })
  batchAddCollection(ctx) // does not wait for add documents requests
  return { message: 'Index created' }
}

async function getIndexes() {
  try {
    const credentials = await getCredentials()
    return await meilisearch.http(meilisearch.client(credentials)).getIndexes()
  } catch (e) {
    return []
  }
}

async function getStats({ collection }) {
  const credentials = await getCredentials()
  return meilisearch
    .http(meilisearch.client(credentials))
    .getStats({ indexUid: collection })
}

async function getCollections() {
  const indexes = await getIndexes()
  const hookedCollections = await getHookedCollections()
  const collectionTypes = getCollectionTypes()
  const configuredCollections = strapi.config.plugins.meilisearch.collections.filter(({name, index}) => !(!name || !collectionTypes.includes(name) || (typeof index === 'string' && !index.length)));

  const collections = configuredCollections.map(async collection => {
    const existInMeilisearch = !!indexes.find(
      index => index.name === (collection.index || collection.name)
    )
    const { numberOfDocuments = 0, isIndexing = false } = existInMeilisearch
      ? await getStats({ collection: (collection.index || collection.name) })
      : {}
    const numberOfRows = await numberOfRowsInCollection({ collection: collection.name })
    return {
      name: collection.name,
      indexed: existInMeilisearch,
      index: collection.index || collection.name,
      numberOfDocuments,
      numberOfRows,
      hooked: true,
    }
  })
  return { collections: await Promise.all(collections) }
}

async function reload(ctx) {
  ctx.send('ok')
  const {
    config: { autoReload },
  } = strapi
  if (!autoReload) {
    return {
      message:
        'Reload is only possible in develop mode. Please reload server manually.',
      title: 'Reload failed',
      error: true,
      link:
        'https://strapi.io/documentation/developer-docs/latest/developer-resources/cli/CLI.html#strapi-start',
    }
  } else {
    strapi.reload.isWatching = false
    strapi.reload()
    return { message: 'ok' }
  }
}

module.exports = {
  getCredentials: async ctx => sendCtx(ctx, getCredentials),
  indexDocuments: async ctx => sendCtx(ctx, indexDocuments),
  waitForDocumentsToBeIndexed: async ctx =>
    sendCtx(ctx, waitForDocumentsToBeIndexed),
  getIndexes: async ctx => sendCtx(ctx, getIndexes),
  getCollections: async ctx => sendCtx(ctx, getCollections),
  addCollection: async ctx => sendCtx(ctx, addCollection),
  addCredentials: async ctx => sendCtx(ctx, addCredentials),
  deleteAllIndexes: async ctx => sendCtx(ctx, deleteAllIndexes),
  deleteIndex: async ctx => sendCtx(ctx, deleteIndex),
  UpdateCollections: async ctx => sendCtx(ctx, UpdateCollections),
  reload: async ctx => sendCtx(ctx, reload),
  batchAddCollection: async ctx => sendCtx(ctx, batchAddCollection),
}
