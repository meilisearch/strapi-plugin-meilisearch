module.exports = () => ({
  storeService: strapi.plugins.meilisearch.services.store,
  meilisearchService: strapi.plugins.meilisearch.services.meilisearch,
  clientService: strapi.plugins.meilisearch.services.client,
})
