/**
 * Adds the settings specific to this collection in Meilisearch.
 */

module.exports = {
  meilisearch: {
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
}
