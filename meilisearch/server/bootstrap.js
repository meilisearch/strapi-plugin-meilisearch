'use strict'

module.exports = async ({ strapi }) => {
  const store = strapi.plugin('meilisearch').service('store')

  await store.syncCredentials()
}
