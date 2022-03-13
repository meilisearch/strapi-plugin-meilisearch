module.exports = ({ strapi }) => {
  // const store = strapi.plugin('meilisearch').service('store')
  const contentTypeService = strapi.plugin('meilisearch').service('contentType')
  return {
    addLifecyclesToContentType({ contentType }) {
      const contentTypeUid = contentTypeService.getContentTypeUid({
        contentType: contentType,
      })
      console.log(`add life cycles to ${contentTypeUid}`)

      strapi.db.lifecycles.subscribe({
        models: [contentTypeUid], // Add all the models a user wants to index in Meilisearch,
        afterCreate(event) {
          const { result, params } = event
          let data = params.data
          console.log({ result, params })
          // const meilisearch = strapi
          //   .plugin('meilisearch')
          //   .service('meilisearch')
          if (!Array.isArray(data)) data = [data]
          console.log({ contentTypeUid })

          // meilisearch.addOneEntryInMeiliSearch({ contentType: })
          console.log('afterCreate')
        },
        afterCreateMany() {
          console.log('afterCreateMany')
        },
        afterUpdate() {
          console.log('afterUpdate')
        },
        afterUpdateMany() {
          console.log('afterUpdateMany')
        },
        afterDelete() {
          console.log('afterDelete')
        },
        afterDeleteMany() {
          console.log('afterDeleteMany')
        },
      })
    },
  }
}
