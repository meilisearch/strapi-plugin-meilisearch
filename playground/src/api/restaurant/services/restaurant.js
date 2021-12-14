'use strict';

/**
 * restaurant service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::restaurant.restaurant', ({ strapi }) => {
  return {
    meilisearch: {
      transformEntry({ entry }) {
        const transformed = {
          ...entry,
          categories: entry.categories.map(cat => cat.name)
        };
        return transformed;
      },
      indexName: "my_restaurant",
      settings:  {
        "searchableAttributes": ["*"]
      }
    }
  }
});
