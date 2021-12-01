'use strict'

module.exports = ({ strapi }) => {
  const strapiStore = strapi.store({
    type: 'plugin',
    name: 'meilisearch',
  })

  return {
    /**
     * Get value of a given key from the store.
     *
     * @param  {string} key
     */
    // DOES NOT WORK
    getStoreKey: async function ({ key }) {
      return strapiStore.get({ key })
    },

    /**
     * Set value of a given key to the store.
     *
     * @param  {string} key
     * @param  {any} value
     */
    // WORK
    setStoreKey: async function ({ key, value }) {
      return strapiStore.set({
        key,
        value,
      })
    },
  }
}
