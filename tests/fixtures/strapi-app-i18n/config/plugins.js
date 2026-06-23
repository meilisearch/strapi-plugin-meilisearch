const path = require('path')

/**
 * Build plugin configuration for the i18n fixture app.
 *
 * @param {{ env: (name: string, defaultValue?: string) => string }} options - Strapi config utilities.
 * @returns {object} Plugin configuration.
 */
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
            locale: '*',
            populate: {
              categories: {
                fields: ['name', 'publishedAt'],
              },
            },
          },
          /**
           * Normalize category relations for indexing.
           *
           * @param {{ entry: { categories?: Array<{ name?: string, publishedAt?: string | null }> } }} params - Entry payload to transform.
           * @returns {object} Entry with categories flattened to names.
           */
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
