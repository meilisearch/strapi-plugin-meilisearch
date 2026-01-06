module.exports = ({ env }) => ({
  meilisearch: {
    enabled: true,
    config: {
      host: env('MEILISEARCH_HOST', 'http://localhost:7700'),
      apiKey: env('MEILISEARCH_API_KEY', 'masterKey'),
      'restaurant': {
        filterEntry({ entry }) {
          return entry.id !== 2
        },
        transformEntry({ entry }) {
          return {
            ...entry,
            categories: entry.categories.map(category => category.name),
          }
        },
        indexName: ['my_restaurant'],
        settings: {
          searchableAttributes: ['*'],
        },
      },
      'about-us': {
        indexName: ['content'],
      },
      'homepage': {
        indexName: ['content'],
      },
    },
  },
})
