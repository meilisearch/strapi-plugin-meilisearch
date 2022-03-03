'use strict'

module.exports = ({ strapi }) => ({
  /**
   * Get all content types being plugins or API's existing in Strapi instance.
   *
   * @returns {string[]} - list of all content types's.
   */
  getContentTypes() {
    const contentTypes = Object.keys(strapi.contentTypes)
      .filter(contentType => !contentType.startsWith('admin::'))
      .reduce((contentTypes, contentType) => {
        contentTypes[contentType] = strapi.contentTypes[contentType]
        return contentTypes
      }, [])

    return contentTypes
  },

  /**
   * Get all content types name being plugins or API's existing in Strapi instance.
   *
   * Content Types are formated like this: `type::apiName.contentType`.
   *
   * @returns {string[]} - list of all content types name.
   */
  getContentTypesName() {
    const contentTypesName = Object.keys(strapi.contentTypes)
      .filter(contentType => !contentType.startsWith('admin::'))
      .reduce((names, contentType) => {
        const name = contentType.split(/[(::).]/g)
        names.push(name[name.length - 1])
        return names
      }, [])
    return contentTypesName
  },

  /**
   * Wether the content type exists or not.
   *
   * @param  {string} contentType - Name of the content type.
   *
   * @returns  {number}
   */
  contentTypeExists({ contentType }) {
    return !!Object.keys(strapi.contentTypes).includes(contentType)
  },

  /**
   * Number of entries in a content type.
   *
   * @param  {string} contentType - Name of the contentType.
   *
   * @returns  {number} number of entries in the content type.
   */
  numberOfEntries: async function ({ contentType, where = {} }) {
    if (!this.contentTypeExists({ contentType })) return 0

    const count = await strapi.db.query(contentType).count({ where })
    return count
  },

  /**
   * Returns the total number of entries of the content types.
   *
   * @param  {string[]} contentTypes List of the content types.
   *
   * @returns {number} Total entries number of the content types.
   */
  totalNumberOfEntries: async function ({ contentTypes }) {
    let numberOfEntries = await Promise.all(
      contentTypes.map(async contentType =>
        this.numberOfEntries({ contentType })
      )
    )

    const entriesSum = numberOfEntries.reduce((acc, curr) => (acc += curr), 0)

    return entriesSum
  },

  /**
   * Returns a batch of entries of a given content type.
   * More information: https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/entity-service/crud.html#findmany
   *
   * @param  {number} fields - Fields present in the returned entry.
   * @param  {number} start - Pagination start.
   * @param  {number} limit - Number of entries to return.
   * @param  {object} filters - Filters to use.
   * @param  {object} sort - Order definition.
   * @param  {object} populate - Relations, components and dynamic zones to populate.
   * @param  {object} publicationState - Publication state: live or preview.
   * @param  {string} contentType - Content type.
   *
   * @returns  {object[]} - Entries.
   */
  async getContentTypeEntries({
    contentType,
    fields = '*',
    limit = 500,
    filters = {},
    sort = {},
    populate = {},
    publicationState,
  }) {
    if (!this.contentTypeExists({ contentType })) return []

    const entries = await strapi.entityService.findMany(contentType, {
      fields: fields || '*',
      limit,
      filters,
      sort,
      populate,
      publicationState: publicationState || 'live',
    })
    return entries || []
  },

  /**
   * Apply an action on all the entries of the provided content type.
   *
   * @param  {string} contentType - Name of the content type.
   * @param  {function} callback - Function applied on each entry of the contentType.
   *
   * @returns {any[]} - List of all the returned elements from the callback.
   */
  actionInBatches: async function ({ contentType, callback = () => {} }) {
    const BATCH_SIZE = 500
    // Need total number of entries in collection
    const entries_count = await this.numberOfEntries({ contentType })
    const cbResponse = []

    for (let index = 0; index <= entries_count; index += BATCH_SIZE) {
      const entries =
        (await this.getContentTypeEntries({
          offset: index,
          limit: BATCH_SIZE,
          contentType,
        })) || []

      const info = await callback(entries, contentType)
      if (Array.isArray(info)) cbResponse.push(...info)
    }
    return cbResponse
  },
})
