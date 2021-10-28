'use strict'
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const { sanitizeEntity } = require('strapi-utils')

module.exports = {
  meilisearch: {
    transformEntry(entry, model) {
      return sanitizeEntity(entry, { model })
    },
  },
}
