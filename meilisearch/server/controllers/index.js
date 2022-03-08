'use strict'

const meilisearchController = require('./meilisearch')
const credentialController = require('./credential')
const collectionController = require('./collection')
const reloadController = require('./reload')

module.exports = {
  meilisearchController,
  credentialController,
  collectionController,
  reloadController,
}
