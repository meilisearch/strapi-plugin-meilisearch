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
          const transformed = {
            ...entry,
            name: entry.title
          };
          return transformed;
        },
        indexName: "my_restaurant",
        settings:  {
          "searchableAttributes": ["*"]
        }
      },
      about: {
        indexName: "my_content",
      },
      homepage: {
        indexName: "my_content",
      },
      // host: "http://localhost:7700",
      // apiKey: "masterKey"
    }
  }
});
