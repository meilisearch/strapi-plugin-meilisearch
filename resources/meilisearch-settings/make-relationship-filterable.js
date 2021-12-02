/**
 * Imagine if you have a collection restaurant with a category field.
 * Category is a collection of its own. They have a many-to-many relationship.
 *
 * In MeiliSearch you can use filters to for example in our case, only find italian restaurants.
 * To be able to do that, you need to provide a list of values and add in the settings the field in `filterableAttributes`.
 * See guide: https://docs.meilisearch.com/reference/features/filtering_and_faceted_search.html#configuring-filters
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
 * Since MeiliSearch is expecting `category: ["Italian", "french"]` and
 * also `category` to be in `filterableAttributes` we can use the model configuration file to provide all these informations.
 */

module.exports = {
  meilisearch: {
    settings: {
      filterableAttributes: ['categories'], // add categories to filterable attributes.
    },
    transformEntry({ entry }) {
      const transformedEntry = {
        ...entry,
        categories: entry.categories.map(cat => cat.name), // map categories to only have categories name.
      }
      return transformedEntry
    },
  },
}
