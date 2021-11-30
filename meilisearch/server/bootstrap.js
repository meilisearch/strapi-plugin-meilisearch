'use strict'

module.exports = ({ strapi }) => {
  // To access users contentTypes use the following strapi.contentTypes.
  // It does not seem to be documented nor does it appear in the keys of `strapi`
  console.log(Object.keys(strapi))
  console.log(strapi.plugin('meilisearch').service('meilisearchService')) // works

  // Successfully logged in the terminal
}
