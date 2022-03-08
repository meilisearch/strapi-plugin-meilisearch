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
   * Get the content type uid in this format: "type::service.contentType".
   *
   * If it is already an uid it returns it. If not it searches for it
   *
   * @param  {object} options
   * @param  {string} options.contentType - Name of the contentType.
   *
   * @returns  {string | undefined} Returns the contentType uid
   */
  getContentTypeUid({ contentType }) {
    const contentTypes = strapi.contentTypes
    const contentTypeUids = Object.keys(contentTypes)
    if (contentTypeUids.includes(contentType)) return contentType

    const contentTypdUid = contentTypeUids.find(uid => {
      return contentTypes[uid].modelName === contentType
    })

    return contentTypdUid
  },

  /**
   * Number of entries in a content type.
   *
   * @param  {object} options
   * @param  {string} options.contentType - Name of the contentType.
   * @param  {object} [options.where] - Filter condition
   *
   * @returns  {Promise<number>} number of entries in the content type.
   */
  numberOfEntries: async function ({ contentType, where = {} }) {
    const contentTypeUid = this.getContentTypeUid({ contentType })
    if (contentTypeUid === undefined) return 0

    try {
      const count = await strapi.db.query(contentTypeUid).count({ where })
      return count
    } catch (e) {
      strapi.log.warn(e)
      return 0
    }
  },

  /**
   * Returns the total number of entries of the content types.
   *
   * @param  {object} options
   * @param  {string[]} options.contentTypes - Names of the contentType.
   * @param  {object} [options.where] - Filter condition
   *
   * @returns {Promise<number>} Total entries number of the content types.
   */
  totalNumberOfEntries: async function ({ contentTypes, where = {} }) {
    let numberOfEntries = await Promise.all(
      contentTypes.map(async contentType =>
        this.numberOfEntries({ contentType, where })
      )
    )
    const entriesSum = numberOfEntries.reduce((acc, curr) => (acc += curr), 0)
    return entriesSum
  },

  /**
   * Returns a batch of entries of a given content type.
   * More information: https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/entity-service/crud.html#findmany
   * @param  {object} options
   * @param  {string | string[]} [options.fields] - Fields present in the returned entry.
   * @param  {number} [options.start] - Pagination start.
   * @param  {number} [options.limit] - Number of entries to return.
   * @param  {object} [options.filters] - Filters to use.
   * @param  {object} [options.sort] - Order definition.
   * @param  {object} [options.populate] - Relations, components and dynamic zones to populate.
   * @param  {object} [options.publicationState] - Publication state: live or preview.
   * @param  {string} [options.contentType] - Content type.
   *
   * @returns  {Promise<object[]>} - Entries.
   */
  async getContentTypeEntries({
    contentType,
    fields = '*',
    start = 0,
    limit = 500,
    filters = {},
    sort = {},
    populate = {},
    publicationState,
  }) {
    const contentTypeUid = this.getContentTypeUid({ contentType })
    if (contentTypeUid === undefined) return []

    const entries = await strapi.entityService.findMany(contentTypeUid, {
      fields: fields || '*',
      start,
      limit,
      filters,
      sort,
      populate,
      publicationState: publicationState || 'live',
    })
    // Safe guard in case the content-type is a single type.
    // In which case it is wrapped in an array for consistency.
    if (entries && !Array.isArray(entries)) return [entries]
    return entries || []
  },

  /**
   * Apply an action on all the entries of the provided content type.
   *
   * @param  {object} options
   * @param  {string} options.collection - Name of the content type.
   * @param  {function} options.callback - Function applied on each entry of the contentType.
   *
   * @returns {Promise<any[]>} - List of all the returned elements from the callback.
   */
  actionInBatches: async function ({ collection, callback = () => {} }) {
    const BATCH_SIZE = 500
    const contentType = collection

    // Need total number of entries in collection
    const entries_count = await this.numberOfEntries({
      contentType,
    })
    const cbResponse = []

    for (let index = 0; index <= entries_count; index += BATCH_SIZE) {
      const entries =
        (await this.getContentTypeEntries({
          start: index,
          limit: BATCH_SIZE,
          contentType,
        })) || []

      const info = await callback({ entries, contentType })
      if (Array.isArray(info)) cbResponse.push(...info)
    }
    return cbResponse
  },
})
