'use strict'

module.exports = {
  meilisearch: {
    config: {
      restaurant: {
        transformEntry({ entry }) {
          const transformedEntry = entry
          // remove created by and updated by fields
          delete transformedEntry.created_by
          delete transformedEntry.updated_by
          return transformedEntry
        },
      },
    },
  },
}
