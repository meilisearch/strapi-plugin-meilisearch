'use strict'
const { sanitizeEntity } = require('strapi-utils')

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  meilisearch: {
    transformEntry(entry, model) {
      entry = {
        ...entry,
        categories: entry.categories.map(cat => cat.name),
      }
      entry = sanitizeEntity(entry, { model })
      return entry
    },
  },
}
