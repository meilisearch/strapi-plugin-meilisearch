module.exports = () => ({
  storeService: strapi.plugins.meilisearch.services.store,
  meilisearchService: strapi.plugins.meilisearch.services.meilisearch,
  clientService: strapi.plugins.meilisearch.services.client,
  storeClient: strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'meilisearch_store',
  }),
  lifeCycleService: strapi.plugins.meilisearch.services.lifecycles,
})
