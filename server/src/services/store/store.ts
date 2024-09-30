const storeStoreService = ({ strapi }) => {
  const strapiStore = strapi.store({
    type: 'plugin',
    name: 'meilisearch',
  })

  return {
    /**
     * Get value of a given key from the store.
     *
     * @param  {object} options
     * @param  {string} options.key
     */
    getStoreKey: async ({ key }) => {
      return strapiStore.get({ key })
    },

    /**
     * Set value of a given key to the store.
     *
     * @param  {object} options
     * @param  {string} options.key
     * @param  {any} options.value
     */
    setStoreKey: async ({ key, value }) => {
      return strapiStore.set({
        key,
        value,
      })
    },

    /**
     * Delete a store
     *
     * @param  {object} options
     * @param  {string} options.key
     * @param  {any} options.value
     */
    deleteStore: async ({ key }) => {
      return strapiStore.delete({
        key,
      })
    },
  }
}

export default storeStoreService;