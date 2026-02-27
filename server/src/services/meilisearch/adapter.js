export default ({ strapi }) => {
  const contentTypeService = strapi.plugin('meilisearch').service('contentType')
  return {
    /**
     * Add the prefix of the contentType in front of the documentId of its entry.
     *
     * We do this to avoid id's conflict in case of composite indexes.
     * It returns the id in the following format: `[collectionName]-[documentId]`
     *
     * Uses documentId (stable across draft/published) instead of the internal
     * database id to prevent duplicate entries in Meilisearch when Draft & Publish
     * is enabled.
     *
     * @param  {object} options
     * @param  {string} options.contentType - ContentType name.
     * @param  {string} options.entryDocumentId - Entry documentId.
     *
     * @returns {string} - Formated id
     */
    addCollectionNamePrefixToId: function ({ contentType, entryDocumentId }) {
      const collectionName = contentTypeService.getCollectionName({
        contentType,
      })

      return `${collectionName}-${entryDocumentId}`
    },

    /**
     * Add the prefix of the contentType on a list of entries using documentId.
     *
     * We do this to avoid id's conflict in case of composite indexes.
     * The ids are transformed in the following format: `[collectionName]-[documentId]`
     *
     * @param  {object} options
     * @param  {string} options.contentType - ContentType name.
     * @param  {object[]} options.entries - entries.
     *
     * @returns {object[]} - Formatted entries.
     */
    addCollectionNamePrefix: function ({ contentType, entries }) {
      return entries.reduce((acc, entry) => {
        if (entry.documentId == null) {
          strapi.log.warn(
            `Entry in ${contentType} is missing documentId, skipping indexing for this entry`,
          )
          return acc
        }
        acc.push({
          ...entry,
          _meilisearch_id: this.addCollectionNamePrefixToId({
            entryDocumentId: entry.documentId,
            contentType,
          }),
        })
        return acc
      }, [])
    },
  }
}
