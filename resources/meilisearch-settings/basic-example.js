/**
 * Adds the settings specific to this content-type in Meilisearch.
 */

module.exports = {
  meilisearch: {
    config: {
      restaurant: {
        settings: {
          filterableAttributes: ['genres'],
          distinctAttribute: null,
          searchableAttributes: ['title', 'description', 'genres'],
          synonyms: {
            wolverine: ['xmen', 'logan'],
            logan: ['wolverine', 'xmen'],
          },
        },
      },
    },
  },
}
