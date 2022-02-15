const path = require('path');

module.exports = ({ env }) => ({
  'meilisearch': {
    enabled: true,
    resolve: path.resolve(__dirname, '../src/plugins/meilisearch'),
    config: {
      restaurant: {
        transformEntry({ entry }) {
          const transformed = {
            id: entry.id + 1
          };
          return transformed;
        },
        indexName: "my_restaurant",
        settings:  {
          "searchableAttributes": ["*"]
        }
      }
      // host: string
      // apiKey : string
    }
  }
});
