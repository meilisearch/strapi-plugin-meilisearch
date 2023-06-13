/**
 * Imagine if you have a content-type restaurant with a categories field.
 * Category is a content-type of its own. They have a many-to-many relationship.
 *
 * In Meilisearch you can use filters to for example in our case, only find italian restaurants.
 * To be able to do that, you need to provide a list of values and add in the settings the field in `filterableAttributes`.
 * See guide: https://www.meilisearch.com/docs/learn/advanced/filtering
 *
 * In Strapi, when fetching an entry the many-to-many relationships are inside an object:
 *
 * {
 *   id: 1,
 *   restaurant_name: "The squared pizza",
 *   category: [
 *      { id: 1, name: "italian" },
 * *    { id: 2, name: "French" }
 *   ]
 * }
 *
 * Since Meilisearch is expecting `category: ["Italian", "french"]` and
 * also `category` to be in `filterableAttributes` we can use the model configuration file to provide all these informations.
 */

module.exports = {
  meilisearch: {
    config: {
      restaurant: {
        settings: {
          filterableAttributes: ['categories'], // add categories to filterable attributes.
        },
        transformEntry({ entry }) {
          return {
            ...entry,
            categories: entry.categories.map(cat => cat.name), // map categories to only have categories name.
          }
        },
      },
    },
  },
}
