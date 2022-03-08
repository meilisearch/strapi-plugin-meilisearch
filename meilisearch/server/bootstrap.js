'use strict'

module.exports = async ({ strapi }) => {
  // console.log(strapi)
  // const ct = await strapi
  //   .plugin('meilisearch')
  //   .service('contentTypes')
  //   .getContentTypeEntries({
  //     contentType: 'plugin::users-permissions.user',
  //   })
  // console.log(ct)
  // console.log(strapi.contentTypes)
  // uid syntax: 'api::api-name.content-type-name'
  // const test = await strapi.db
  //   .query('plugin::users-permissions.user')
  //   .findMany()
  // console.log(test)
  // console.log(Object.keys(strapi.contentType()))
  // const ct = await strapi
  //   .plugin('meilisearch')
  //   .service('contentTypes')
  //   .getContentTypes()
  // console.log(ct)
  // const entries = await strapi.db
  //   .query('plugin::users-permissions.user')
  //   .findMany({})
  // const entries2 = await strapi.entityService.findMany(
  //   'plugin::users-permissions.user'
  // )
  // console.log({ entries, entries2 })
  // console.log(strapi.getModel('plugin::users-permissions.user'))

  // const entries = await strapi
  //   .plugin('meilisearch')
  //   .service('contentTypes')
  //   .getContentTypeEntries({ contentType: 'api::about.about' })
  // console.log(entries)

  const store = strapi.plugin('meilisearch').service('store')

  await store.syncCredentials()
  const credentials = await store.getCredentials()
  console.log({ credentials })
}
