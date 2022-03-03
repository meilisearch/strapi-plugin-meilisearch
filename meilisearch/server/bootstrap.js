'use strict'

module.exports = async ({ strapi }) => {
  // console.log(strapi)
  console.log(Object.keys(strapi))
  console.log(strapi.plugin('meilisearch'))
  console.log(Object.getPrototypeOf(strapi))
  // const ct = await strapi
  //   .plugin('meilisearch')
  //   .service('contentTypes')
  //   .findManyOfCollection({ collection: 'haha' })
  // console.log(ct)
}
