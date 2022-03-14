'use strict'

module.exports = ({ strapi }) => {
  const store = strapi.plugin('meilisearch').service('store')
  return {
    /**
     * Get Client Credentials from the Store.
     *
     */
    async getCredentials(ctx) {
      const credentials = await store.getCredentials()

      ctx.body = { data: credentials }
    },

    /**
     * Add Meilisearch Credentials to the Store.
     *
     * @param  {object} ctx - Http request object.
     */
    async addCredentials(ctx) {
      const { host, apiKey } = ctx.request.body
      const credentials = await store.addCredentials({ host, apiKey })

      ctx.body = { data: credentials }
    },
  }
}
