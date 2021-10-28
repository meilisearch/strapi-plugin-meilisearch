'use strict'
const MeiliSearch = require('./client')

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
module.exports = async ({ storeConnector, collectionConnector }) => {
  const { apiKey, host } = await storeConnector.getCredentials()

  return {
    store: storeConnector,
    /**
     * Delete multiples entries from the collection in its index in MeiliSearch.
     *
     * @param  {string} collection - Collection name.
     * @param  {number[]} entriesId - Entries id.
     */
    deleteEntriesFromMeiliSearch: async function ({ collection, entriesId }) {
      const client = MeiliSearch({ apiKey, host })
      const indexUid = collectionConnector.getIndexName(collection)
      await client.index(indexUid).deleteDocuments(entriesId)
    },
    /**
     * Wait for a number of update to be processed in MeiliSearch.
     *
     * Because collection entries are added in batches a lot of updates are created.
     * To avoid having to wait for all of them tobe processed, this functions watched a certain
     * number of it at a time.
     *
     * This gives the possibility to the front-end to show the progress of entries indexation.
     *
     * @param  {string} indexUid - Index name.
     * @param  {number} updateNbr - Number of updates to watch.
     *
     * @returns {number} - Number of documents added.
     */
    waitForPendingUpdates: async function ({ indexUid, updateNbr }) {
      const client = MeiliSearch({ apiKey, host })
      const updates = (await client.index(indexUid).getAllUpdateStatus())
        .filter(update => update.status === 'enqueued')
        .slice(0, updateNbr)
      let documentsAdded = 0
      for (const update of updates) {
        const { updateId } = update
        const task = await client
          .index(indexUid)
          .waitForPendingUpdate(updateId, { intervalMs: 500 })
        const {
          type: { number },
        } = task
        documentsAdded += number
      }
      return documentsAdded
    },

    /**
     * Wait for the collection to be indexed in MeiliSearch.
     *
     * @param  {string} collection - Collection name.
     *
     * @returns { numberOfDocumentsIndexed: number }
     */
    waitForCollectionIndexation: async function (collection) {
      const numberOfDocumentsIndexed = await this.waitForPendingUpdates({
        indexUid: collectionConnector.getIndexName(collection),
        updateNbr: 2,
      })
      return { numberOfDocumentsIndexed }
    },

    /**
     * Get indexes with a safe guard in case of error.
     *
     * @returns { string[] }
     */
    getIndexes: async function () {
      try {
        const client = MeiliSearch({ apiKey, host })
        return await client.getIndexes()
      } catch (e) {
        return []
      }
    },

    /**
     * Get stats of an index with a safe guard in case of error.
     *
     * @param { string } - Index uid.
     *
     * @returns { object }
     */
    getStats: async function (indexUid) {
      try {
        const client = MeiliSearch({ apiKey, host })
        return await client.index(indexUid).getStats()
      } catch (e) {
        return {}
      }
    },

    /**
     * Information about collections in MeiliSearch.
     *
     * @returns {object[]} - List of collections reports.
     */
    getCollectionsReport: async function () {
      const indexes = await this.getIndexes()

      const watchedCollections = await storeConnector.getWatchedCollections()
      const multiRowsCollections = collectionConnector.listAllMultiEntriesCollections()
      const collections = multiRowsCollections.map(async collection => {
        const indexUid = collectionConnector.getIndexName(collection)

        const existInMeilisearch = !!indexes.find(
          index => index.name === indexUid
        )
        const { numberOfDocuments = 0, isIndexing = false } = existInMeilisearch
          ? await this.getStats(indexUid)
          : {}

        const numberOfEntries = await collectionConnector.numberOfEntries(
          collection
        )
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
      const client = MeiliSearch({ apiKey, host })
      if (!Array.isArray(entry)) {
        entry = [entry]
      }
      const indexUid = collectionConnector.getIndexName(collection)
      return client
        .index(indexUid)
        .addDocuments(collectionConnector.transformEntries(collection, entry))
    },

    /**
     * Add all entries from a collection to its index in MeiliSearch.
     *
     * @param  {string} collection - Collection name.
     * @returns {number[]} - All updates id from the batched indexation process.
     */
    addCollectionInMeiliSearch: async function (collection) {
      const client = MeiliSearch({ apiKey, host })
      const indexUid = collectionConnector.getIndexName(collection)
      await client.getOrCreateIndex(indexUid)
      const entries_count = await collectionConnector.numberOfEntries(
        collection
      )
      // console.log({ entries_count })
      const BATCH_SIZE = 1000
      const updateIds = []

      for (let index = 0; index <= entries_count; index += BATCH_SIZE) {
        const entries =
          (await collectionConnector.getEntriesBatch({
            start: index,
            limit: BATCH_SIZE,
            collection,
          })) || []
        const indexUid = collectionConnector.getIndexName(collection)
        const documents = collectionConnector.transformEntries(
          collection,
          entries
        )
        // console.log(JSON.stringify(documents, null, 2))

        const { updateId } = client.index(indexUid).addDocuments(documents)
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
      const client = MeiliSearch({ apiKey, host })
      // Delete whole index only if the index is not a composite index
      const indexUid = await collectionConnector.getIndexName(collection)

      if (collection === collectionConnector.getIndexName(collection)) {
        const { updateId } = await client.index(indexUid).deleteAllDocuments()
        await this.waitForPendingUpdates({
          updateId,
          indexUid: indexUid,
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
      const client = MeiliSearch({ apiKey, host })
      const isCompositeIndex = collectionConnector.isCompositeIndex(collection)
      const indexUid = await collectionConnector.getIndexName(collection)
      if (!isCompositeIndex) {
        await client.index(indexUid).delete()
      } else {
        // TODO if composite
        await client.index(indexUid).delete()
      }
      return { message: 'ok' }
    },

    /**
     * Get list of index uids in MeiliSearch instance.
     *
     * @returns {number[]} - Index uids
     */
    getIndexUidsOfIndexedCollections: async function (collections) {
      const client = MeiliSearch({ apiKey, host })
      let indexes = await client.getIndexes()
      indexes = indexes.map(index => index.uid)
      return collections.filter(collection =>
        indexes.includes(collectionConnector.getIndexName(collection))
      )
    },
  }
}
