'use strict'

module.exports = ({ store }) => ({
  /**
   * Get listened collections from the store.
   *
   * @param  {string} key
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
   * @param  {string} value
   */
  setIndexedCollections: async function (value = {}) {
    return store.setStoreKey({ key: 'meilisearch_indexed_collections', value })
  },

  /**
   * Add a collection to the indexed collection list if it is not already present.
   *
   * @param  {string} collection
   */
  addIndexedCollection: async function (collection) {
    const indexedCollections = await this.getIndexedCollections()
    const newSet = new Set(indexedCollections)
    newSet.add(collection)
    return this.setIndexedCollections([...newSet])
  },

  /**
   * Remove a collection from the indexed collection list if it exists.
   *
   * @param {string} collection
   * @returns {array} collections
   */
  removeIndexedCollection: async function (collection) {
    const indexedCollections = await this.getIndexedCollections()
    const newSet = new Set(indexedCollections)
    newSet.delete(collection)
    return this.setIndexedCollections([...newSet])
  },

  /**
   * Add a collection to the listened collections list.
   *
   * @param {string[]} - Collections names that listened.
   * @returns {string[]} - Collection names.
   */
  appendListenedCollection: async function (collection) {
    const listenedCollections = await this.getListenedCollections()
    const newSet = new Set(listenedCollections)
    newSet.add(collection)
    return this.setListenedCollections([...newSet])
  },

  /**
   * Add multiple collections to the listened collections list.
   *
   * @param {string[]} - Collections names that listened.
   * @returns {string[]} - Collection names.
   */
  appendListenedCollections: async function (collections) {
    for (const collection of collections) {
      await this.appendListenedCollection(collection)
    }
    return this.getListenedCollections()
  },
})
