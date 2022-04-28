'use strict'

module.exports = {
  meilisearch: {
    config: {
      restaurant: {
        async transformEntry({ entry }) {
          const info = await myAsyncFunction() // eslint-disable-line
          const transformedEntry = {
            ...entry,
            ...info,
          }
          return transformedEntry
        },
      },
    },
  },
}
