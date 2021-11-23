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
     * Add the prefix of the collection in front of the id of its entry.
     *
     * We do this to avoid id's conflict in case of composite indexes.
     * It returns the id in the following format: `[collectionName]-[id]`
     *
     * @param  {string} collection - Collection name.
     * @param  {number} entryId - Entry id.
     *
     * @returns {string} - Formated id
     */
    addCollectionPrefixToId: function ({ collection, entryId }) {
      return `${collection}-${entryId}`
    },

    /**
     * Add the prefix of the collection on a list of entries id.
     *
     * We do this to avoid id's conflict in case of composite indexes.
     * The ids are transformed in the following format: `[collectionName]-[id]`
     *
     * @param  {string} collection - Collection name.
     * @param  {object[]} entries - entries.
     *
     * @returns {object[]} - Formatted entries.
     */
    addCollectionPrefixToIdOfEntries: function ({ collection, entries }) {
      return entries.map(entry => ({
        ...entry,
        id: this.addCollectionPrefixToId({ entryId: entry.id, collection }),
      }))
    },

    /**
     * Delete multiples entries from the collection in its index in MeiliSearch.
     *
     * @param  {string} collection - Collection name.
     * @param  {number[]} entriesId - Entries id.
     */
    deleteEntriesFromMeiliSearch: async function ({ collection, entriesId }) {
      const client = MeiliSearch({ apiKey, host })
      const indexUid = collectionConnector.getIndexName(collection)
      const documentsIds = entriesId.map(entryId =>
        this.addCollectionPrefixToId({ entryId, collection })
      )
      await client.index(indexUid).deleteDocuments(documentsIds)
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
    waitForPendingUpdates: async function ({ collection, updateNbr }) {
      const client = MeiliSearch({ apiKey, host })
      const indexUid = collectionConnector.getIndexName(collection)
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
        collection,
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
        console.error(e)
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
      const indexUids = indexes.map(index => index.uid)

      // All listened collections
      const listenedCollections = await storeConnector.getListenedCollections()

      // Is collection not single-type-collection
      const collections = collectionConnector.listAllMultiEntriesCollections()

      const reports = await Promise.all(
        collections.map(async collection => {
          const indexUid = collectionConnector.getIndexName(collection)

          const indexedCollections = await storeConnector.getIndexedCollections(
            collection
          )

          const indexInMeiliSearch = indexUids.includes(indexUid)
          const collectionInIndexStore = indexedCollections.includes(collection)
          const indexed = indexInMeiliSearch && collectionInIndexStore

          // safe guard in case index does not exist anymore in MeiliSearch
          if (!indexInMeiliSearch && collectionInIndexStore) {
            await storeConnector.removeIndexedCollection(collection)
          }

          const {
            numberOfDocuments = 0,
            isIndexing = false,
          } = indexUids.includes(indexUid) ? await this.getStats(indexUid) : {}

          const collectionsWithSameIndexUid = await collectionConnector.listCollectionsWithIndexName(
            indexUid
          )

          const numberOfEntries = await collectionConnector.totalNumberOfEntries(
            collectionsWithSameIndexUid
          )

          return {
            collection,
            indexUid,
            indexed,
            isIndexing,
            numberOfDocuments,
            numberOfEntries,
            listened: listenedCollections.includes(collection),
          }
        })
      )
      return { collections: reports }
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

      const entries = collectionConnector.transformEntries({
        collection,
        entries: entry,
      })
      const documents = this.addCollectionPrefixToIdOfEntries({
        collection,
        entries,
      })
      const update = client.index(indexUid).addDocuments(documents)
      await storeConnector.addIndexedCollection(collection)

      return update
    },

    /**
     * Add all entries from a collection to its index in MeiliSearch.
     *
     * @param  {string} collection - Collection name.
     * @returns {number[]} - All updates id from the batched indexation process.
     */
    addCollectionInMeiliSearch: async function (collection) {
      const indexUid = collectionConnector.getIndexName(collection)
      const client = MeiliSearch({ apiKey, host })
      await client.getOrCreateIndex(indexUid)

      const addDocuments = async (entries, collection) => {
        let transformedEntries = collectionConnector.transformEntries({
          collection,
          entries,
        })
        const documents = this.addCollectionPrefixToIdOfEntries({
          collection,
          entries: transformedEntries,
        })

        const indexUid = collectionConnector.getIndexName(collection)
        const { updateId } = await client
          .index(indexUid)
          .addDocuments(documents)
        return updateId
      }

      const updateIds = await collectionConnector.actionInBatches(
        collection,
        addDocuments
      )
      await storeConnector.addIndexedCollection(collection)

      return { updateIds }
    },

    emptyOrDeleteIndex: async function (collection) {
      const indexedColWithIndexName = await this.getCollectionsWithSameIndex(
        collection
      )
      if (indexedColWithIndexName.length > 1) {
        const deleteEntries = async (entries, collection) => {
          await this.deleteEntriesFromMeiliSearch({
            collection,
            entriesId: entries.map(entry => entry.id),
          })
        }
        await collectionConnector.actionInBatches(collection, deleteEntries)
      } else {
        const client = MeiliSearch({ apiKey, host })
        const indexUid = await collectionConnector.getIndexName(collection)
        await client.index(indexUid).deleteIfExists()
      }
      await storeConnector.removeIndexedCollection(collection)
    },

    /**
     * Update all entries from a collection to its index in MeiliSearch.
     *
     * @param  {string} collection - Collection name.
     * @returns {number[]} - All updates id from the indexation process.
     */
    updateCollectionInMeiliSearch: async function (collection) {
      const indexedCollections = await storeConnector.getIndexedCollections()
      if (indexedCollections.includes(collection)) {
        await this.emptyOrDeleteIndex(collection)
      }
      return this.addCollectionInMeiliSearch(collection)
    },

    /**
     * Search for the list of all collections that share the same index name.
     *
     * @param  {string} collection
     *
     * @returns {sring[]} - Collections names.
     */
    getCollectionsWithSameIndex: async function (collection) {
      const indexUid = await collectionConnector.getIndexName(collection)

      // Fetch collections that has the same indexName as the provided collection
      const collectionsWithSameIndex = await collectionConnector.listCollectionsWithIndexName(
        indexUid
      )

      // get all collections (not indexes) indexed in MeiliSearch.
      const indexedCollections = await storeConnector.getIndexedCollections(
        collection
      )

      // Take union of both array
      const indexedColWithIndexName = indexedCollections.filter(col =>
        collectionsWithSameIndex.includes(col)
      )

      return indexedColWithIndexName
    },

    /**
     * Remove or empty a collection from MeiliSearch
     *
     * @param  {string} collection - Collection name.
     */
    removeCollectionFromMeiliSearch: async function (collection) {
      await this.emptyOrDeleteIndex(collection)
      return { message: 'ok' }
    },

    /**
     * Get list of index uids in MeiliSearch instance.
     *
     * @returns {number[]} - Index uids
     */
    getCollectionsIndexedInMeiliSearch: async function (collections) {
      const client = MeiliSearch({ apiKey, host })
      let indexes = await client.getIndexes()
      indexes = indexes.map(index => index.uid)
      return collections.filter(collection =>
        indexes.includes(collectionConnector.getIndexName(collection))
      )
    },
  }
}
