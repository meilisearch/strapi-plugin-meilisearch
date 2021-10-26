'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  transformEntryForMeiliSearch(entry) {
    const transformedEntry = entry
    // remove created by and updated by fields
    delete transformedEntry.created_by
    delete transformedEntry.updated_by
    return transformedEntry
  },
  searchIndexName: 'my_restaurant',
}
