'use strict'

// Returns timestamp
function dateToTimeStamp(date) {
  const dateInstance = new Date(date)
  return dateInstance.getTime()
}

module.exports = {
  meilisearch: {
    config: {
      restaurant: {
        transformEntry({ entry }) {
          const transformedEntry = {
            ...entry,
            // transform date format to timestamp
            // 2021-03-03T12:09:10.979Z => 1614773350979
            created_by: dateToTimeStamp(entry.created_by),
            updated_by: dateToTimeStamp(entry.updated_by),
          }
          return transformedEntry
        },
      },
    },
  },
}
