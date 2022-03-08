'use strict'
module.exports = () => {
  return {
    /**
     * Add the prefix of the collection in front of the id of its entry.
     *
     * We do this to avoid id's conflict in case of composite indexes.
     * It returns the id in the following format: `[collectionName]-[id]`
     *
     * @param  {object} options
     * @param  {string} options.collection - Collection name.
     * @param  {number} options.entryId - Entry id.
     *
     * @returns {string} - Formated id
     */
    addCollectionPrefixToId: function ({ collection, entryId }) {
      return `${collection}-${entryId}`
    },

    /**
     * Add the prefix of the collection on a list of entries id.
     *
     * We do this to avoid id's conflict in case of composite indexes.
     * The ids are transformed in the following format: `[collectionName]-[id]`
     *
     * @param  {object} options
     * @param  {string} options.collection - Collection name.
     * @param  {object[]} options.entries - entries.
     *
     * @returns {object[]} - Formatted entries.
     */
    addCollectionPrefixToIdOfEntries: function ({ collection, entries }) {
      return entries.map(entry => ({
        ...entry,
        id: this.addCollectionPrefixToId({ entryId: entry.id, collection }),
      }))
    },
  }
}
