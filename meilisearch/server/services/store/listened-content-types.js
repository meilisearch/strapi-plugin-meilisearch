'use strict'

module.exports = ({ store }) => ({
  /**
   * Get listened contentTypes from the store.
   *
   * @returns {Promise<string[]>} - ContentType names.
   */
  getListenedContentTypes: async function () {
    const contentTypes = await store.getStoreKey({
      key: 'meilisearch_listened_content_types',
    })
    return contentTypes || []
  },

  /**
   * Set listened contentTypes to the store.
   * @param  {object} options
   * @param  {string[]} options.contentTypes
   *
   * @returns {Promise<string[]>} - ContentType names.
   */
  setListenedContentTypes: async function ({ contentTypes = [] }) {
    return store.setStoreKey({
      key: 'meilisearch_listened_content_types',
      contentTypes,
    })
  },

  /**
   * Add a contentType to the listened contentTypes list.
   *
   * @param  {object} options
   * @param  {string} options.contentType
   *
   * @returns {Promise<string[]>} - ContentType names.
   */
  appendListenedContentType: async function ({ contentType }) {
    const listenedContentTypes = await this.getListenedContentTypes()
    const newSet = new Set(listenedContentTypes)
    newSet.add(contentType)
    return this.setListenedContentTypes({ contentTypes: [...newSet] })
  },

  /**
   * Add multiple contentTypes to the listened contentTypes list.
   *
   * @param  {object} options
   * @param  {string[]} options.contentTypes
   *
   * @returns {Promise<string[]>} - ContentType names.
   */
  appendListenedContentTypes: async function ({ contentTypes }) {
    for (const contentType of contentTypes) {
      await this.appendListenedContentType({ contentType })
    }
    return this.getListenedContentTypes()
  },
})
