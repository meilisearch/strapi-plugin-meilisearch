export default ({ strapi }) => {
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
    getStoreKey: async function ({ key }) {
      return strapiStore.get({ key })
    },

    /**
     * Set value of a given key to the store.
     *
     * @param  {object} options
     * @param  {string} options.key
     * @param  {any} options.value
     */
    setStoreKey: async function ({ key, value }) {
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
    deleteStore: async function ({ key }) {
      return strapiStore.delete({
        key,
      })
    },
  }
}
