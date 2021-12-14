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
    key: 'meilisearch-test2',
  })
) // OUTPUT: Works
console.log(
  'GET STORE KEY METHOD 2:',
  await strapi
    .plugin('meilisearch')
    .service('store')
    .getStoreKey({ key: 'meilisearch-test2' })
) // OUTPUT: does not

const strapiStore = await strapi.store({
  type: 'plugin',
  name: 'meilisearch',
})
const gettedValue = await strapiStore.get({ key: 'meilisearch-test2' })
// OUTPUT: test
console.log({ gettedValue })

console.log(
  'delete key',
  await strapi.store().delete({ key: 'undefined_meilisearch-hihi' })
)

// const settedValue = await strapiStore.set({
  //   key: 'meilisearch-test',
  //   value: 'test',
  // })
  // const gettedValue = await strapiStore.get({ key: 'meilisearch-test' })
  // console.log({ settedValue, gettedValue })
  // Successfully logged in the terminal

  console.log(
    'GET STORE KEY METHOD 2:',
    await strapi.plugin('meilisearch').service('store')
    )
  // OUTPUT: ==>
  // {
  //   getStoreKey: [AsyncFunction: getStoreKey],
  //   setStoreKey: [AsyncFunction: setStoreKey]
  // }

  // path: ./strapi-server.js

const config = require('./config');

module.exports = () => ({
  config: {
    default: ({ env }) => ({ optionA: true }),
    validator: (config) => {
      if (typeof config.optionA !== 'boolean') {
        throw new Error('optionA has to be a boolean');
      }
    },
  },
});
