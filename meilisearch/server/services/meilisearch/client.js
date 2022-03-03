'use strict'
const { MeiliSearch } = require('meilisearch')

/**
 * Custom Meilisearch Error class more suited to Strapi environment.
 */
// TODO: is this useful
class MeiliSearchError extends Error {
  constructor(
    {
      message = 'Something went wrong with Meilisearch',
      title = 'Operation on Meilisearch failed',
      link,
    },
    ...params
  ) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchError)
    }
    this.name = 'MeiliSearchError'
    this.type = 'MeiliSearchError'
    this.message = message
    this.title = title
    this.link = link
  }
}

/**
 * Create a MeiliSearch client instance.
 *
 * @param  {object} config - Information to pass to the constructor.
 *
 * @returns { object } - MeiliSearch client instance.
 */
module.exports = config => {
  try {
    return new MeiliSearch(config)
  } catch (e) {
    console.error(e)
    throw new MeiliSearchError({
      message: 'Please provide a valid host for your Meilisearch instance',
      link:
        'https://docs.meilisearch.com/learn/getting_started/installation.html#download-and-launch',
    })
  }
}
