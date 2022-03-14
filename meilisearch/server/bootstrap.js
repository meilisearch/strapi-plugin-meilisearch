'use strict'
/**
 * @param  {object} options
 * @param  {string[]} options.contentTypes - all indexed content types
 * @param  {object} options.store - all indexed content types
 * @param  {object} options.lifecycle - lifecycle API
 */
async function subscribeToLifecycles({ contentTypes, lifecycle, store }) {
  await store.emptyListenedContentTypes()
  let lifecycles
  for (const contentType of contentTypes) {
    lifecycles = await lifecycle.subscribeContentType({ contentType })
  }

  return lifecycles
}

module.exports = async ({ strapi }) => {
  // Add lifecycles functions to indexed content types
  const store = strapi.plugin('meilisearch').service('store')
  const lifecycle = strapi.plugin('meilisearch').service('lifecycle')

  await store.syncCredentials()
  const indexedContentTypes = await store.getIndexedContentTypes()

  await subscribeToLifecycles({
    contentTypes: indexedContentTypes,
    lifecycle,
    store,
  })
}
