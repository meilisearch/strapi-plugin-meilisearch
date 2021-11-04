'use strict'
const { MeiliSearch } = require('meilisearch')

const MeiliSearchError = () => strapi.plugins.meilisearch.services.error

module.exports = config => {
  try {
    return new MeiliSearch(config)
  } catch (e) {
    throw new (MeiliSearchError())({
      message: 'Please provide a valid host for your MeiliSearch instance',
      link: 'https://docs.meilisearch.com/learn/getting_started/installation.html#download-and-launch',
    })
  }
}
