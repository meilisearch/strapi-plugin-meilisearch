'use strict'

module.exports = () => ({
  plugin: strapi.plugins.meilisearch.services,
  storeClient: strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'meilisearch_store',
  }),
  models: strapi.models,
  pluginConfig: strapi.config.plugins,
  services: strapi.services,
})
