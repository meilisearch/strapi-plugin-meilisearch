'use strict'

module.exports = ({ store }) => ({
  /**
   * Get listened collections from the store.
   *
   * @returns {Promise<string[]>} - Collection names.
   */
  getListenedCollections: async function () {
    const collections = await store.getStoreKey({
      key: 'meilisearch_listened_collections',
    })
    return collections || []
  },

  /**
   * Set listened collections to the store.
   *
   * @param  {string[]} collections
   *
   * @returns {Promise<string[]>} - Collection names.
   */
  setListenedCollections: async function (collections = []) {
    return store.setStoreKey({
      key: 'meilisearch_listened_collections',
      collections,
    })
  },
})
