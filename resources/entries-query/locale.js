// All entries in every language are indexed in Meilisearch.
module.exports = {
  meilisearch: {
    config: {
      restaurant: {
        entriesQuery: {
          locale: '*',
        },
      },
    },
  },
}
