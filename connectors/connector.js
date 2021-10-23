'use strict'

const createCollectionConnector = require('./collection')
const createMeiliSearchConnector = require('./meilisearch')

/**
 * Connector factory to communicate between Strapi, the store, and MeiliSearch
 *
 * @param {Object} strapi - Strapi environment.
 * @param {Object} strapi.plugin - Plugins required services.
 * @param {Object} strapi.models - Strapi models.
 * @param {Object} strapi.services - Strapi services.
 * @param {Object} clients - Required clients.
 * @param {Object} clients.MeiliSearchClient - Constructor to create a MeiliSearch client.
 * @param {Object} clients.storeClient - Store instance.
 */
module.exports = async (
  { plugin, models, services },
  { storeClient, MeiliSearchClient }
) => {
  const colConnector = createCollectionConnector(services, models)
  const store = plugin.store(storeClient)
  const apiKey = await store.getStoreKey('meilisearch_api_key')
  const host = await store.getStoreKey('meilisearch_host')
  const client = MeiliSearchClient({ apiKey, host })
  const meilisearch = createMeiliSearchConnector(client)

  return {
    /**
     * Add Clients credentials to the store
     *
     * @param  {Object} credentials
     * @param  {string} credentials.host - Host of the searchClient.
     * @param  {string} credentials.apiKey - ApiKey of the searchClient.
     *
     * @return {{ host: string, apiKey: string}} - Credentials
     */
    addCredentials: async function ({ host, apiKey }) {
      const {
        configFileApiKey,
        configFileHost,
      } = await this.storedCredentials()
      if (!configFileApiKey) {
        await store.setApiKey(apiKey)
      }
      if (!configFileHost) {
        await store.setHost(host)
      }
      return this.storedCredentials()
    },

    /**
     * Update clients credentials in the store
     *
     * @param  {Object} config - Credentials
     */
    updateStoreCredentials: async function (config) {
      // optional chaining is not natively supported by node 12.
      let apiKey = false
      let host = false

      if (config && config.meilisearch) {
        apiKey = config.meilisearch.apiKey
        host = config.meilisearch.host
      }

      if (apiKey) {
        await store.setApiKey(apiKey)
      }
      await store.setConfigApiKey(!!apiKey)

      if (host) {
        await store.setHost(host)
      }
      await store.setConfigHost(!!host)
    },

    /**
     * Get credentials from the store and from the config file.
     *
     * @return {{ host: string, apiKey: string, configFileHost: string, configFileApiKey: string}}
     */
    storedCredentials: async function () {
      const apiKey = await store.getApiKey()
      const host = await store.getHost()
      const configFileApiKey = (await store.getConfigApiKey()) || false
      const configFileHost = (await store.getConfigHost()) || false
      return { apiKey, host, configFileApiKey, configFileHost }
    },

    /**
     * Delete multiples entries from the collection in its index in MeiliSearch.
     *
     * @param  {string} collection - Collection name.
     * @param  {number[]} entriesId - Entries id.
     */
    deleteEntriesFromMeiliSearch: async function ({ collection, entriesId }) {
      await meilisearch.deleteDocuments({
        indexUid: colConnector.getIndexName(collection),
        documentIds: entriesId,
      })
    },

    /**
     * Wait for the collection to be indexed in MeiliSearch
     *
     * @param  {string} collection - Collection name.
     *
     * @returns { numberOfDocumentsIndexed: number }
     */
    waitForCollectionIndexation: async function (collection) {
      const numberOfDocumentsIndexed = await meilisearch.waitForPendingUpdates({
        indexUid: colConnector.getIndexName(collection),
        updateNbr: 2,
      })
      return { numberOfDocumentsIndexed }
    },

    /**
     * Information about collections in MeiliSearch.
     *
     * @returns {object[]} - List of collections reports.
     */
    getCollectionsReport: async function () {
      const indexes = await meilisearch.getIndexes()
      const watchedCollections = await this.getWatchedCollections()
      const multiRowsCollections = colConnector.listAllMultiEntriesCollections()
      const collections = multiRowsCollections.map(async collection => {
        const indexUid = colConnector.getIndexName(collection)

        const existInMeilisearch = !!indexes.find(
          index => index.name === indexUid
        )
        const { numberOfDocuments = 0, isIndexing = false } = existInMeilisearch
          ? await meilisearch.getStats({ indexUid })
          : {}

        const numberOfEntries = await colConnector.numberOfEntries(collection)
        return {
          collection,
          indexUid,
          indexed: existInMeilisearch,
          isIndexing,
          numberOfDocuments,
          numberOfEntries,
          hooked: watchedCollections.includes(collection),
        }
      })
      return { collections: await Promise.all(collections) }
    },

    /**
     * Add one entry from a collection to its index in MeiliSearch.
     *
     * @param  {string} collection - Collection name.
     * @param  {string} entry - Entry from the document.
     * @returns {{ updateId: number }} - Update information.
     */
    addOneEntryInMeiliSearch: async function ({ collection, entry }) {
      if (!Array.isArray(entry)) {
        entry = [entry]
      }
      return meilisearch.addDocuments({
        indexUid: colConnector.getIndexName(collection),
        data: this.transformEntries(collection, entry),
      })
    },

    /**
     * Add all entries from a collection to its index in MeiliSearch.
     *
     * @param  {string} collection - Collection name.
     * @returns {number[]} - All updates id from the batched indexation process.
     */
    addCollectionInMeiliSearch: async function (collection) {
      await meilisearch.createIndex({
        indexUid: colConnector.getIndexName(collection),
      })
      const entries_count = await colConnector.numberOfEntries(collection)
      const BATCH_SIZE = 1000
      const updateIds = []

      for (let index = 0; index <= entries_count; index += BATCH_SIZE) {
        const entries =
          (await colConnector.getEntriesBatch({
            start: index,
            limit: BATCH_SIZE,
            collection,
          })) || []

        const indexUid = colConnector.getIndexName(collection)
        const { updateId } = await meilisearch.addDocuments({
          indexUid,
          data: this.transformEntries(collection, entries),
        })

        if (updateId) updateIds.push(updateId)
      }
      return { updateIds }
    },

    /**
     * Update all entries from a collection to its index in MeiliSearch.
     *
     * @param  {string} collection - Collection name.
     * @returns {number[]} - All updates id from the indexation process.
     */
    updateCollectionInMeiliSearch: async function (collection) {
      // Delete whole index only if the index is not a composite index
      if (collection === colConnector.getIndexName(collection)) {
        const { updateId } = await meilisearch.deleteAllDocuments({
          indexUid: colConnector.getIndexName(collection),
        })
        await meilisearch.waitForPendingUpdate({
          updateId,
          indexUid: colConnector.getIndexName(collection),
        })
      }
      return this.addCollectionInMeiliSearch(collection)
    },
    /**
     * Remove a collection from MeiliSearch
     *
     * @param  {string} collection - Collection name.
     */
    removeCollectionFromMeiliSearch: async function (collection) {
      const isCompositeIndex = colConnector.isCompositeIndex(collection)

      if (!isCompositeIndex) {
        await meilisearch.deleteIndex({
          indexUid: colConnector.getIndexName(collection),
        })
      } else {
        // TODO if composite
        await meilisearch.deleteIndex({
          indexUid: colConnector.getIndexName(collection),
        })
      }
      return { message: 'ok' }
    },

    /**
     * Get watched collections from the store
     *
     * @returns {string[]} - Collection names.
     */
    getWatchedCollections: async function () {
      const collections = await store.getHookedCollections()
      return collections || []
    },

    /**
     * Create watched collections in the store
     *
     * @returns {[]}
     */
    createWatchedCollectionsStore: async function () {
      return store.setHookedCollections([])
    },

    /**
     * Add watched collections to the store.
     *
     * @param {string[]} - Collections names that watched.
     * @returns {string[]} - Collection names.
     */
    addWatchedCollectionToStore: async function (collections) {
      return store.setHookedCollections(collections)
    },

    /**
     * Get list of index uids in MeiliSearch Instance
     *
     * @returns {number[]} - Index uids
     */
    getIndexUidsOfIndexedCollections: async function (collections) {
      let indexes = await meilisearch.getIndexes()
      indexes = indexes.map(index => index.uid)
      return collections.filter(collection =>
        indexes.includes(colConnector.getIndexName(collection))
      )
    },

    /**
     * Transform collection entries before indexation in MeiliSearch.
     *
     * @param {string} collection - Collection name.
     * @param {Array<Object>} data  - The data to convert. Conversion will use
     * the static method `toSearchIndex` defined in the model definition
     *
     * @return {Array<Object>} - Converted or mapped data
     */
    transformEntries: function (collection, entries) {
      const model = models[collection]
      const mapFunction = model.toSearchIndex
      if (!(mapFunction instanceof Function)) {
        return entries
      }
      if (Array.isArray(entries)) {
        entries.map(mapFunction)
        return entries.map(mapFunction)
      }
      return mapFunction(entries)
    },
  }
}
