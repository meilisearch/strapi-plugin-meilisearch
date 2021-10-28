'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  meilisearch: {
    transformEntry(entry) {

      const transformedEntry = {
        ...entry,
        categories: entry.categories.map(cat => cat.name)
      };
      return transformedEntry

    },
    indexName: "wqwewqe"
  }
}
