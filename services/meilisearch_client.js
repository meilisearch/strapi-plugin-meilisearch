'use strict'

const { MeiliSearch } = require('meilisearch')

module.exports = (config) => new MeiliSearch(config)
