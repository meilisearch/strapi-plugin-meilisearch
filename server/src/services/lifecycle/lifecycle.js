export default ({ strapi }) => {
  const contentTypeService = strapi.plugin('meilisearch').service('contentType')
  const store = strapi.plugin('meilisearch').service('store')

  return {
    async subscribeContentType({ contentType }) {
      const contentTypeUid = contentTypeService.getContentTypeUid({
        contentType,
      })
      if (!contentTypeUid) return

      // In Strapi v5+, document middleware handles all Meilisearch syncing.
      // This method only tracks listened content-types.
      return store.addListenedContentType({
        contentType: contentTypeUid,
      })
    },
  }
}
