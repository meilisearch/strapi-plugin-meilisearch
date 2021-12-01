'use strict'

module.exports = ({ store }) => ({
  /**
   * Get listened collections from the store.
   *
   * @returns {string[]} - Collection names.
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
   * @param  {string} value
   *
   * @returns {string[]} - Collection names.
   */
  setListenedCollections: async function (value = []) {
    return store.setStoreKey({
      key: 'meilisearch_listened_collections',
      value,
    })
  },
})
