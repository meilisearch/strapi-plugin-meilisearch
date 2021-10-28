'use strict'
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  meilisearch: {
    transformEntry(entry, model) {
      return  {
        ...entry,
        categories: entry.categories.map(cat => cat.name)
      };
    },
    indexName: "my_restaurant"
  }
}


