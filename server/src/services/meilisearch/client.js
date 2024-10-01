'use strict'
const { MeiliSearch: Meilisearch } = require('meilisearch')
const packageJson = require('../../../../package.json')

/**
 * Create a Meilisearch client instance.
 *
 * @param  {object} config - Information to pass to the constructor.
 *
 * @returns { object } - Meilisearch client instance.
 */
module.exports = config =>
  new Meilisearch({
    ...config,
    clientAgents: [`Meilisearch Strapi (v${packageJson.version})`],
  })
