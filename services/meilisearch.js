'use strict'

const { MeiliSearch } = require('meilisearch')

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey'
}
const client = new MeiliSearch(config)

/**
 * meilisearch.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

module.exports = {
  async getOrCreateIndex (indexUid) {
    return client.getOrCreateIndex(indexUid)
  },
  async deleteIndex (indexUid) {
    return client.deleteIndex(indexUid)
  },
  async addDocuments (indexUid, documents) {
    return client.index(indexUid).addDocuments(documents)
  },
  async deleteDocuments (indexUid, documentsId) {
    return client.index(indexUid).deleteDocuments(documentsId)
  }
}
