module.exports = {
  async bootstrap({ strapi }) {
    const meilisearchPlugin = strapi.plugin('meilisearch')
    const store = meilisearchPlugin.service('store')
    const meilisearch = meilisearchPlugin.service('meilisearch')

    const contentType = 'api::restaurant.restaurant'
    const indexedContentTypes = await store.getIndexedContentTypes()

    if (!indexedContentTypes.includes(contentType)) {
      await meilisearch.addContentTypeInMeiliSearch({ contentType })
    }
  },
}
