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
          entriesQuery: {
            populate: {
              categories: {
                fields: ['name', 'publishedAt'],
              },
            },
          },
          transformEntry({ entry }) {
            const related = entry.categories
            const categories = Array.isArray(related)
              ? related
                  .filter(
                    cat =>
                      cat != null &&
                      typeof cat === 'object' &&
                      !(
                        cat.publishedAt === undefined ||
                        cat.publishedAt === null
                      ),
                  )
                  .map(cat => cat.name)
              : []
            return { ...entry, categories }
          },
          settings: {
            searchableAttributes: ['*'],
          },
        },
      },
    },
  }
}
