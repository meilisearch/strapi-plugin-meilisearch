export const meilisearchAdapterService = ({ strapi }) => {
  const contentTypeService = strapi.plugin('meilisearch').service('contentType')
  return {
    /**
     * Add the prefix of the contentType in front of the id of its entry.
     *
     * We do this to avoid id's conflict in case of composite indexes.
     * It returns the id in the following format: `[collectionName]-[id]`
     *
     * @param  {object} options
     * @param  {string} options.contentType - ContentType name.
     * @param  {number} options.entryId - Entry id.
     *
     * @returns {string} - Formated id
     */
    addCollectionNamePrefixToId: ({ contentType, entryId }) => {
      const collectionName = contentTypeService.getCollectionName({
        contentType,
      })

      return `${collectionName}-${entryId}`
    },

    /**
     * Add the prefix of the contentType on a list of entries id.
     *
     * We do this to avoid id's conflict in case of composite indexes.
     * The ids are transformed in the following format: `[collectionName]-[id]`
     *
     * @param  {object} options
     * @param  {string} options.contentType - ContentType name.
     * @param  {object[]} options.entries - entries.
     *
     * @returns {object[]} - Formatted entries.
     */
    addCollectionNamePrefix: function ({ contentType, entries }) {
      return entries.map(entry => ({
        ...entry,
        _meilisearch_id: this.addCollectionNamePrefixToId({
          entryId: entry.id,
          contentType,
        }),
      }))
    },
  }
}