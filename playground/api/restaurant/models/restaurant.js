'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

// TODO: remove example
module.exports = {
  toSearchIndex(entry) {
    // how does bootstrap works with composite indexes
    const transformedEntry = {
      ...entry,
      id: parseInt(entry.id + Math.random() * 10000),
      categories: entry.categories.map(cat => cat.name),
      // I dont understand this fields naming neither the number
      model: "restaurant"
    };
    delete transformedEntry.created_by
    delete transformedEntry.updated_by
    // console.log(transformedEntry);
    return transformedEntry
  },

  // if searchIndexName is same with others
  isUsingCompositeIndex: true,
  // should not crash the whole server?, why the `$` ?
  // searchIndexTypeId: 'restaurant',
  // searchIndexName: 'test'

}
