'use strict'
const MeiliSearch = require('./client')

module.exports = ({ strapi, adapter, config }) => {
  const store = strapi.plugin('meilisearch').service('store')
  const contentType = strapi.plugin('meilisearch').service('contentType')
  return {
    /**
     * Get indexes with a safe guard in case of error.
     *
     * @returns { Promise<import("meilisearch").Index[]> }
     */
    getIndexes: async function () {
      try {
        const { apiKey, host } = await store.getCredentials()
        const client = MeiliSearch({ apiKey, host })
        const indexes = await client.getIndexes()
        return indexes
      } catch (e) {
        strapi.log.warn(e)
        return []
      }
    },

    /**
     * Delete multiples entries from the collection in its index in Meilisearch.
     *
     * @param  {object} options
     * @param  {string} options.collection - Collection name.
     * @param  {number[]} options.entriesId - Entries id.
     *
     * @returns  { Promise<import("meilisearch").Task>} p - Task body returned by Meilisearch API.
     */
    deleteEntriesFromMeiliSearch: async function ({ collection, entriesId }) {
      const { apiKey, host } = await store.getCredentials()
      const client = MeiliSearch({ apiKey, host })

      const indexUid = config.getIndexNameOfCollection({ collection })
      const documentsIds = entriesId.map(entryId =>
        adapter.addCollectionPrefixToId({ entryId, collection })
      )

      return await client.index(indexUid).deleteDocuments(documentsIds)
    },

    /**
     * Wait for an task to be processed in Meilisearch.
     *
     * @param  {object} options
     * @param  {string} options.collection - Collection name.
     * @param  {number} options.taskUid - Task identifier.
     *
     * @returns  { Promise<import("meilisearch").Task  | number>} p - Task body returned by Meilisearch API.
     */
    waitForTask: async function ({ collection, taskUid }) {
      try {
        const { apiKey, host } = await store.getCredentials()
        const client = MeiliSearch({ apiKey, host })
        const indexUid = config.getIndexNameOfCollection({ collection })
        const task = await client
          .index(indexUid)
          .waitForTask(taskUid, { intervalMs: 5000 })

        return task
      } catch (e) {
        strapi.log.warn(e)
        return 0
      }
    },

    /**
     * Wait for a batch of tasks uids to be processed.
     *
     * @param  {object} options
     * @param  {string} options.collection - Collection name.
     * @param  {number[]} options.taskUids - Array of tasks identifiers.
     *
     * @returns  { Promise<(import("meilisearch").Task| number)[]> } p - Task body returned by Meilisearch API.
     */
    waitForTasks: async function ({ collection, taskUids }) {
      const tasks = []
      for (const taskUid of taskUids) {
        const status = await this.waitForTask({
          collection,
          taskUid,
        })
        tasks.push(status)
      }
      return tasks
    },

    /**
     * Get enqueued tasks ids of indexed collections.
     *
     * @returns { Promise<Record<string, number[]> | {}> } - Collections with their respective task uids
     */
    getEnqueuedTaskUids: async function () {
      const indexes = await this.getIndexes()
      const indexUids = indexes.map(index => index.uid)
      const collections = contentType.getContentTypesName()
      const { apiKey, host } = await store.getCredentials()
      const client = MeiliSearch({ apiKey, host })

      const collectionTaskUids = {}
      const { results: tasks } = await client.getTasks()
      for (const collection of collections) {
        const indexUid = config.getIndexNameOfCollection({ collection })
        if (indexUids.includes(indexUid)) {
          const enqueueded = tasks
            .filter(
              task => task.status === 'enqueued' && task.indexUid === indexUid
            )
            .map(task => task.uid)
          collectionTaskUids[collection] = enqueueded
        }
      }
      return collectionTaskUids
    },

    /**
     * Get stats of an index with a safe guard in case of error.
     *
     * @param  {object} options
     * @param { string } options.indexUid
     *
     * @returns {Promise<import("meilisearch").IndexStats> }
     */
    getStats: async function ({ indexUid }) {
      try {
        const { apiKey, host } = await store.getCredentials()
        const client = MeiliSearch({ apiKey, host })
        return await client.index(indexUid).getStats()
      } catch (e) {
        return {
          numberOfDocuments: 0,
          isIndexing: false,
          fieldDistribution: {},
        }
      }
    },

    /**
     * Information about collections in Meilisearch.
     *
     * @returns {Promise<{ collections: Array<{
     * collection: string,
     * indexUid: string,
     * indexed: boolean,
     * isIndexing: boolean,
     * numberOfDocuments: number,
     * numberOfEntries: number,
     * listened: boolean,
     * }>}>} - List of collections reports.
     */
    getCollectionsReport: async function () {
      const indexes = await this.getIndexes()
      const indexUids = indexes.map(index => index.uid)

      // All listened collections
      const listenedCollections = await store.getListenedCollections()

      // Is collection not single-type-collection
      const collections = contentType.getContentTypesName()

      const reports = await Promise.all(
        collections.map(async collection => {
          const indexUid = config.getIndexNameOfCollection({ collection })

          const indexedCollections = await store.getIndexedCollections(
            collection
          )

          const indexInMeiliSearch = indexUids.includes(indexUid)
          const collectionInIndexStore = indexedCollections.includes(collection)
          const indexed = indexInMeiliSearch && collectionInIndexStore

          // safe guard in case index does not exist anymore in Meilisearch
          if (!indexInMeiliSearch && collectionInIndexStore) {
            await store.removeIndexedCollection(collection)
          }

          const {
            numberOfDocuments = 0,
            isIndexing = false,
          } = indexUids.includes(indexUid) ? await this.getStats(indexUid) : {}

          const collectionsWithSameIndexUid = await config.listCollectionsWithCustomIndexName(
            { indexName: indexUid }
          )
          const numberOfEntries = await contentType.totalNumberOfEntries({
            contentTypes: collectionsWithSameIndexUid,
          })

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
     * Add one entry from a collection to its index in Meilisearch.
     *
     * @param  {object} options
     * @param  {string} options.collection - Collection name.
     * @param  {object[] | object} options.entry - Entry from the document.
     * @returns {Promise<{ taskUid: number }>} - Task identifier.
     */
    addOneEntryInMeiliSearch: async function ({ collection, entry }) {
      const { apiKey, host } = await store.getCredentials()
      const client = MeiliSearch({ apiKey, host })

      if (!Array.isArray(entry)) {
        entry = [entry]
      }

      const indexUid = config.getIndexNameOfCollection({ collection })

      let entries = config.filterEntries({
        collection,
        entries: entry,
      })
      entries = config.transformEntries({
        collection,
        entries: entry,
      })

      const documents = adapter.addCollectionPrefixToIdOfEntries({
        collection,
        entries,
      })

      const task = await client.index(indexUid).addDocuments(documents)
      await store.addIndexedCollection({ collection })

      return task
    },

    /**
     * Add all entries from a collection to its index in Meilisearch.
     *
     * @param  {object} options
     * @param  {string} options.collection - Collection name.
     *
     * @returns {Promise<number[]>} - All task uids from the batched indexation process.
     */
    addCollectionInMeiliSearch: async function ({ collection }) {
      const { apiKey, host } = await store.getCredentials()
      const client = MeiliSearch({ apiKey, host })
      const indexUid = config.getIndexNameOfCollection(collection)

      // Get Meilisearch Index settings from model
      const settings = config.getSettings(collection)
      await client.index(indexUid).updateSettings(settings)

      // Callback function for batching action
      const addDocuments = async (entries, collection) => {
        if (entries.length === 0) {
          const task = await client.createIndex(indexUid)
          return task.uid
        }
        let filteredEntries = config.filterEntries({
          collection,
          entries,
        })
        let transformedEntries = config.transformEntries({
          collection,
          entries: filteredEntries,
        })
        const documents = this.addCollectionPrefixToIdOfEntries({
          collection,
          entries: transformedEntries,
        })

        // Add documents in Meilisearch
        const task = await client.index(indexUid).addDocuments(documents)

        return task.uid
      }

      const tasksUids = await contentType.actionInBatches({
        collection,
        callback: addDocuments,
      })

      await store.addIndexedCollection(collection)

      return tasksUids
    },

    /**
     * Search for the list of all collections that share the same index name.
     *
     * @param  {string} collection
     *
     * @returns {Promise<string[]>} - Collections names.
     */
    getCollectionsWithSameIndex: async function (collection) {
      const indexUid = config.getIndexNameOfCollection({ collection })

      // Fetch collections that has the same indexName as the provided collection
      const collectionsWithSameIndex = await config.listCollectionsWithCustomIndexName(
        { indexUid }
      )

      // get all collections (not indexes) indexed in Meilisearch.
      const indexedCollections = await store.getIndexedCollections()

      // Take union of both array
      const indexedColWithIndexName = indexedCollections.filter(col =>
        collectionsWithSameIndex.includes(col)
      )

      return indexedColWithIndexName
    },

    /**
     * Delete or empty an index depending if the collection is part
     * of a composite index.
     *
     * @param  {object} options
     * @param  {string} options.collection - Collection name.
     */
    emptyOrDeleteIndex: async function ({ collection }) {
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
        await contentType.actionInBatches({
          collection,
          callback: deleteEntries,
        })
      } else {
        const { apiKey, host } = await store.getCredentials()
        const client = MeiliSearch({ apiKey, host })

        const indexUid = config.getIndexNameOfCollection({ collection })
        await client.index(indexUid).delete()
      }

      await store.removeIndexedCollection(collection)
    },

    /**
     * Update all entries from a collection to its index in Meilisearch.
     *
     * @param  {object} options
     * @param  {string} options.collection - Collection name.
     *
     * @returns {Promise<number[]>} - All tasks uid from the indexation process.
     */
    updateCollectionInMeiliSearch: async function ({ collection }) {
      const indexedCollections = await store.getIndexedCollections()
      if (indexedCollections.includes(collection)) {
        await this.emptyOrDeleteIndex({ collection })
      }
      return this.addCollectionInMeiliSearch({ collection })
    },

    /**
     * Remove or empty a collection from Meilisearch
     *
     * @param  {object} options
     * @param  {string} options.collection - Collection name.
     *
     * @returns {Promise<{ message: string }>} - All tasks uid from the indexation process.
     */
    removeCollectionFromMeiliSearch: async function ({ collection }) {
      await this.emptyOrDeleteIndex({ collection })
      return { message: 'ok' }
    },

    /**
     * Get list of index uids in Meilisearch instance.
     *
     * @returns {Promise<string[]>} - Index uids
     */
    getCollectionsIndexedInMeiliSearch: async function ({ collections }) {
      const { apiKey, host } = await store.getCredentials()
      const client = MeiliSearch({ apiKey, host })

      let indexes = await client.getIndexes()

      indexes = indexes.map(index => index.uid)
      return collections.filter(collection =>
        indexes.includes(config.getIndexNameOfCollection({ collection }))
      )
    },
  }
}
