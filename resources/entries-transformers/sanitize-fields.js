'use strict'
const { sanitizeEntity } = require('strapi-utils')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

function encodeHTML(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

module.exports = {
  meilisearch: {
    transformEntry(entry) {
      // It is better to use a library to do this but here is a native "working" example
      const transformedEntry = {
        ...entry,
        description: encodeHTML(entry.description),
      }
      return transformedEntry
    },
  },
}
