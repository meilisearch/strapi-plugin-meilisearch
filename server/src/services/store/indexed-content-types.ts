const storeIndexedContentTypesService = ({ store }) => ({
  /**
   * Get listened contentTypes from the store.
   *
   * @returns {Promise<string[]>} List of contentTypes indexed in Meilisearch.
   */
  getIndexedContentTypes: async () => {
    const contentTypes = await store.getStoreKey({
      key: 'meilisearch_indexed_content_types',
    })
    return contentTypes || []
  },

  /**
   * Set indexed contentTypes to the store.
   *
   * @param  {object} options
   * @param  {string[]} options.contentTypes
   *
   * @returns {Promise<string[]>} List of contentTypes indexed in Meilisearch.
   */
  setIndexedContentTypes: async ({ contentTypes }) => {
    return store.setStoreKey({
      key: 'meilisearch_indexed_content_types',
      value: contentTypes,
    })
  },

  /**
   * Add a contentType to the indexed contentType list if it is not already present.
   *
   * @param  {object} options
   * @param  {string} options.contentType
   *
   * @returns {Promise<string[]>} List of contentTypes indexed in Meilisearch.
   */
  addIndexedContentType: async function ({ contentType }) {
    const indexedContentTypes = await this.getIndexedContentTypes()
    const newSet = new Set(indexedContentTypes)
    newSet.add(contentType)

    return this.setIndexedContentTypes({
      contentTypes: [...newSet],
    })
  },

  /**
   * Remove a contentType from the indexed contentType list if it exists.
   *
   * @param  {object} options
   * @param  {string} options.contentType
   *
   * @returns {Promise<string[]>} List of contentTypes indexed in Meilisearch.
   */
  removeIndexedContentType: async function ({ contentType }) {
    const indexedContentTypes = await this.getIndexedContentTypes()

    const newSet = new Set(indexedContentTypes)
    newSet.delete(contentType)
    return this.setIndexedContentTypes({ contentTypes: [...newSet] })
  },
})

export default storeIndexedContentTypesService;