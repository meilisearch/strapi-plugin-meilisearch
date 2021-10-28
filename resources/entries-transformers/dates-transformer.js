'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

// Returns timestamp
function dateToTimeStamp(date) {
  const dateInstance = new Date(date)
  return dateInstance.getTime()
}

module.exports = {
  meilisearch: {
    transformEntry(entry) {
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
}
