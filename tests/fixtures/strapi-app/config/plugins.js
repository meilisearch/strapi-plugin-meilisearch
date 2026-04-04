const path = require('path')

module.exports = ({ env }) => {
  const pluginRoot = path.resolve(__dirname, '../../../../')

  return {
    meilisearch: {
      enabled: true,
      resolve: pluginRoot,
      config: {
        host: env('MEILISEARCH_HOST', 'http://localhost:7700'),
        apiKey: env('MEILISEARCH_API_KEY', 'masterKey'),
        restaurant: {
          indexName: [env('MEILI_TEST_INDEX_NAME', 'test_restaurant')],
          settings: {
            searchableAttributes: ['*'],
          },
        },
      },
    },
  }
}
