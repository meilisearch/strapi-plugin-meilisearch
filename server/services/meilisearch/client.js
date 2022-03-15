'use strict'
const { MeiliSearch } = require('meilisearch')

/**
 * Create a MeiliSearch client instance.
 *
 * @param  {object} config - Information to pass to the constructor.
 *
 * @returns { object } - MeiliSearch client instance.
 */
module.exports = config => new MeiliSearch(config)
