'use strict'

module.exports = async ({ strapi }) => {
  // To access users contentTypes use the following strapi.contentTypes.
  // It does not seem to be documented nor does it appear in the keys of `strapi`
  // console.log(Object.keys(strapi))
  // const collectionTypes = strapi
  //   .plugin('meilisearch')
  //   .service('contentTypes')
  //   .getContentTypes()
  // console.log(Object.keys(collectionTypes))
  // console.log(strapi.api.restaurant.controllers.restaurant.find()) // ctx error
  // console.log(await strapi.api.restaurant.services.restaurant.find()) // ctx error
  // const response = await strapi.db
  //   .query('plugin::users-permissions.user')
  //   .findMany({})
  // console.log(response)
  // console.log(strapi.store)
  console.log(
    'SET STORE KEY:',
    await strapi.plugin('meilisearch').services.store.setStoreKey({
      key: 'meilisearch-test2',
      value: "'test'",
    })
  )
  // OUTPUT:
  // {
  //   id: 29,
  //   key: 'plugin_meilisearch_meilisearch-test2',
  //   value: `"'test'"`,
  //   type: 'string',
  //   environment: null,
  //   tag: null
  // }

  console.log(
    'GET STORE KEY METHOD 1:',
    await strapi.plugin('meilisearch').services.store.getStoreKey({
      key: 'plugin_meilisearch_meilisearch-test2',
    })
  ) // OUTPUT: undefined
  console.log(
    'GET STORE KEY METHOD 2:',
    await strapi
      .plugin('meilisearch')
      .service('store')
      .getStoreKey({ key: 'plugin_meilisearch_meilisearch-test2' })
  ) // OUTPUT: undefined

  // const strapiStore = await strapi.store({
  //   type: 'plugin',
  //   name: 'meilisearch',
  // })
  // const gettedValue = await strapiStore.get({ key: 'meilisearch-test2' })
  // // OUTPUT: test
  // console.log({ gettedValue })

  // console.log(
  //   'delete key',
  //   await strapi.store().delete({ key: 'undefined_meilisearch-hihi' })
  // )

  // const settedValue = await strapiStore.set({
  //   key: 'meilisearch-test',
  //   value: 'test',
  // })
  // const gettedValue = await strapiStore.get({ key: 'meilisearch-test' })
  // console.log({ settedValue, gettedValue })
  // Successfully logged in the terminal
  // strapi.db.query('content-types:list')
  // 'admin::permission',
  // 'admin::user',
  // 'admin::role',
  // 'admin::api-token',
  // 'plugin::upload.file',
  // 'plugin::i18n.locale',
  // 'plugin::users-permissions.permission',
  // 'plugin::users-permissions.role',
  // 'plugin::users-permissions.user',
  // 'api::movie.movie',
  // 'api::restaurant.restaurant'
}
