'use strict'

module.exports = ({ store }) => ({
  /**
   * Get listened collections from the store.
   *
   * @returns {Promise<string[]>} List of collections indexed in Meilisearch.
   */
  getIndexedCollections: async function () {
    const collections = await store.getStoreKey({
      key: 'meilisearch_indexed_collections',
    })
    return collections || []
  },

  /**
   * Set indexed collections to the store.
   *
   * @param  {object} options
   * @param  {string[]} options.collections
   *
   * @returns {Promise<string[]>} List of collections indexed in Meilisearch.
   */
  setIndexedCollections: async function ({ collections }) {
    return store.setStoreKey({
      key: 'meilisearch_indexed_collections',
      value: collections,
    })
  },

  /**
   * Add a collection to the indexed collection list if it is not already present.
   *
   * @param  {object} options
   * @param  {string} options.collection
   *
   * @returns {Promise<string[]>} List of collections indexed in Meilisearch.
   */
  addIndexedCollection: async function ({ collection }) {
    const indexedCollections = await this.getIndexedCollections()
    const newSet = new Set(indexedCollections)
    newSet.add(collection)
    return this.setIndexedCollections({ collections: [...newSet] })
  },

  /**
   * Remove a collection from the indexed collection list if it exists.
   *
   * @param  {object} options
   * @param  {string} options.collection
   *
   * @returns {Promise<string[]>} List of collections indexed in Meilisearch.
   */
  removeIndexedCollection: async function ({ collection }) {
    const indexedCollections = await this.getIndexedCollections()

    const newSet = new Set(indexedCollections)
    newSet.delete(collection)
    return this.setIndexedCollections({ collections: [...newSet] })
  },

  /**
   * Add a collection to the listened collections list.
   *
   * @param  {object} options
   * @param  {string} options.collection
   *
   * @returns {Promise<string[]>} - Collection names.
   */
  appendListenedCollection: async function ({ collection }) {
    const listenedCollections = await this.getListenedCollections()
    const newSet = new Set(listenedCollections)
    newSet.add(collection)
    return this.setListenedCollections({ collections: [...newSet] })
  },

  /**
   * Add multiple collections to the listened collections list.
   *
   * @param  {object} options
   * @param  {string[]} options.collections
   *
   * @returns {Promise<string[]>} - Collection names.
   */
  appendListenedCollections: async function ({ collections }) {
    for (const collection of collections) {
      await this.appendListenedCollection({ collection })
    }
    return this.getListenedCollections()
  },
})
