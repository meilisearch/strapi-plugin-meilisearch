'use strict'

module.exports = () => ({
  storeService: strapi.plugins.meilisearch.services.store,
  meilisearchService: strapi.plugins.meilisearch.services.meilisearch,
  MeiliSearchClient: strapi.plugins.meilisearch.services.client,
  storeClient: strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'meilisearch_store',
  }),
  lifeCycles: strapi.plugins.meilisearch.services.lifecycles,
  models: strapi.models,
  pluginConfig: strapi.config,
  strapiServices: strapi.services,
})
