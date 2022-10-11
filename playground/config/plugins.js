const path = require('path');

module.exports = ({ env }) => ({
  'meilisearch': {
    enabled: true,
    resolve: path.resolve(__dirname, '../src/plugins/meilisearch'),
    config: {
      restaurant: {
        filterEntry({ entry }) {
          return entry.id !== 2
        },
        transformEntry({ entry }) {
          return {
            ...entry,
            categories: entry.categories.map(category => category.name)
          };
        },
        indexName: "my_restaurant",
        settings:  {
          "searchableAttributes": ["*"]
        }
      },
      "about-us": {
        indexName: "content",
      },
      homepage: {
        indexName: "content",
      },
      // host: "http://localhost:7700",
      // apiKey: "masterKey"
    }
  }
});
