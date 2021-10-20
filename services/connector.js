const {
  transformEntries,
  isCollectionACompositeIndex,
  numberOfRowsInCollection,
  getMultiEntriesCollections,
  fetchRowBatch,
} = require('./../services/collection')

const { getIndexName } = require('./../services/indexes')

module.exports = async (clientService, meilisearchService, storeService) => {
  const store = storeService
  const apiKey = await store.getStoreKey('meilisearch_api_key')
  const host = await store.getStoreKey('meilisearch_host')
  const client = clientService({ apiKey, host })
  const meilisearch = meilisearchService(client)
  return {
    meilisearch,
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
      const watchedCollections = await this.watchedCollections()
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
    watchedCollections: async function () {
      const collections = await store.getStoreKey('meilisearch_hooked')
      return collections || []
    },
  }
}
