// Both published and draft entries are added in Meilisearch
module.exports = {
  meilisearch: {
    config: {
      category: {
        entriesQuery: {
          status: 'draft',
        },
      },
    },
  },
}
