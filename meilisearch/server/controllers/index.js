'use strict'

const meilisearchController = require('./meilisearch')
const credentialController = require('./credential')
const contentTypeController = require('./content-type')
const reloadController = require('./reload')

module.exports = {
  meilisearchController,
  credentialController,
  contentTypeController,
  reloadController,
}
