const {
  transformEntries,
  isCollectionACompositeIndex,
  numberOfRowsInCollection,
  getMultiEntriesCollections,
  fetchRowBatch,
} = require('./../services/collection')

const { getIndexName } = require('./../services/indexes')

module.exports = async ({
  clientService,
  meilisearchService,
  storeService,
  storeClient,
}) => {
  console.log({ storeClient })
  console.log({ storeService })

  const store = storeService(storeClient)
  const apiKey = await store.getStoreKey('meilisearch_api_key')
  const host = await store.getStoreKey('meilisearch_host')
  const client = clientService({ apiKey, host })
  const meilisearch = meilisearchService(client)

  return {
    meilisearch,
    addCredentials: async function ({ host, apiKey }) {
      const {
        configFileApiKey,
        configFileHost,
      } = await this.resolveClientCredentials()
      if (!configFileApiKey) {
        await store.setStoreKey({
          key: 'meilisearch_api_key',
          value: apiKey,
        })
      }
      if (!configFileHost) {
        await store.setStoreKey({
          key: 'meilisearch_host',
          value: host,
        })
      }
      return this.resolveClientCredentials()
    },
    updateStoreCredentials: async function (plugins) {
      // optional chaining is not natively supported by node 12.
      let apiKey = false
      let host = false

      if (plugins && plugins.meilisearch) {
        apiKey = plugins.meilisearch.apiKey
        host = plugins.meilisearch.host
      }

      if (apiKey) {
        await store.setStoreKey({
          key: 'meilisearch_api_key',
          value: apiKey,
        })
      }
      await store.setStoreKey({
        key: 'meilisearch_api_key_config',
        value: !!apiKey,
      })

      if (host) {
        await store.setStoreKey({
          key: 'meilisearch_host',
          value: host,
        })
      }
      await store.setStoreKey({
        key: 'meilisearch_host_config',
        value: !!host,
      })
    },
    addCollectionInMeiliSearch: async function ({
      documents = [],
      collection,
    }) {
      const indexUid = getIndexName(collection)
      if (documents.length > 0) {
        return meilisearch.addDocuments({
          indexUid,
          data: transformEntries(collection, documents),
        })
      }
    },
    resolveClientCredentials: async function () {
      const apiKey = await store.getStoreKey('meilisearch_api_key')
      const host = await store.getStoreKey('meilisearch_host')
      const configFileApiKey =
        (await store.getStoreKey('meilisearch_api_key_config')) || false
      const configFileHost =
        (await store.getStoreKey('meilisearch_host_config')) || false
      return { apiKey, host, configFileApiKey, configFileHost }
    },
    getClient: function () {
      return client
    },
    getIndexStats: async function (collection) {
      // TODO should work for compositeIndexes as well
      const indexUid = getIndexName(collection)
      return meilisearch.getStats({ indexUid })
    },
    getIndexes: async function () {
      try {
        return await meilisearch.getIndexes()
      } catch (e) {
        return []
      }
    },
    deleteIndex: async function (collection) {
      await meilisearch.deleteIndex({
        indexUid: getIndexName(collection),
      })
    },
    waitForIndexation: async function (collection) {
      const numberOfDocuments = await meilisearch.waitForPendingUpdates({
        indexUid: getIndexName(collection),
        updateNbr: 2,
      })
      return { numberOfDocuments }
    },
    getCollections: async function () {
      const indexes = await this.getIndexes()
      const watchedCollections = await this.getWatchedCollections()
      const multiRowsCollections = getMultiEntriesCollections()
      const collections = multiRowsCollections.map(async collection => {
        const indexUid = getIndexName(collection)

        const existInMeilisearch = !!indexes.find(
          index => index.name === indexUid
        )
        const { numberOfDocuments = 0, isIndexing = false } = existInMeilisearch
          ? await this.getIndexStats(collection)
          : {}

        const numberOfRows = await numberOfRowsInCollection(collection)
        return {
          collection,
          indexUid,
          indexed: existInMeilisearch,
          isIndexing,
          numberOfDocuments,
          numberOfRows,
          hooked: watchedCollections.includes(collection),
        }
      })
      return { collections: await Promise.all(collections) }
    },
    addCollection: async function (collection) {
      await meilisearch.createIndex({
        indexUid: getIndexName(collection),
      })
      const entries_count = await numberOfRowsInCollection(collection)
      const BATCH_SIZE = 1000
      const updateIds = []

      for (let index = 0; index <= entries_count; index += BATCH_SIZE) {
        const rows_batch = await fetchRowBatch({
          start: index,
          limit: BATCH_SIZE,
          collection,
        })

        const { updateId } = await this.addCollectionInMeiliSearch({
          collection,
          documents: rows_batch,
          meilisearch,
        })
        if (updateId) updateIds.push(updateId)
      }
      return { updateIds }
    },
    updateCollection: async function (collection) {
      // Delete whole index only if the index is not a composite index
      if (collection === getIndexName(collection)) {
        const { updateId } = await meilisearch.deleteAllDocuments({
          indexUid: getIndexName(collection),
        })
        await meilisearch.waitForPendingUpdate({
          updateId,
          indexUid: getIndexName(collection),
        })
      }
      return this.addCollection(collection)
    },
    removeCollection: async function (collection) {
      const isCompositeIndex = isCollectionACompositeIndex(collection)

      if (!isCompositeIndex) {
        await meilisearch.deleteIndex({
          indexUid: getIndexName(collection),
        })
      } else {
        // TODO if composite
        await meilisearch.deleteIndex({
          indexUid: getIndexName(collection),
        })
      }
      return { message: 'ok' }
    },
    getWatchedCollections: async function () {
      const collections = await store.getStoreKey('meilisearch_hooked')
      return collections || []
    },
    createWatchedCollectionsStore: async function () {
      return store.setStoreKey({ key: 'meilisearch_hooked', value: [] })
    },
    addWatchedCollectionToStore: async function (collections) {
      store.setStoreKey({
        key: 'meilisearch_hooked',
        value: collections,
      })
    },
    getIndexUidsOfIndexedCollections: async function (collections) {
      // get list of indexes in MeiliSearch Instance
      let indexes = await this.getIndexes()
      indexes = indexes.map(index => index.uid)
      return collections.filter(model => indexes.includes(getIndexName(model)))
    },
  }
}
