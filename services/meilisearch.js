'use strict'

const { MeiliSearch } = require('meilisearch')

// const config = {
//   host: 'http://127.0.0.1:7700',
//   apiKey: 'masterKey'
// }
const getClient = (config) => new MeiliSearch(config)

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

module.exports = {
  async addDocuments (config, indexUid, documents) {
    const client = getClient(config)
    return client.index(indexUid).addDocuments(documents)
  }
}
