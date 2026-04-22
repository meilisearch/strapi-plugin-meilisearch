import { normalizeEntryLocale, normalizeEntryScope } from './entry-query'

const IGNORED_PLUGINS = [
  'admin',
  'upload',
  'i18n',
  'review-workflows',
  'content-releases',
]
const IGNORED_CONTENT_TYPES = [
  'plugin::users-permissions.permission',
  'plugin::users-permissions.role',
]

const removeIgnoredAPIs = ({ contentTypes }) => {
  const contentTypeUids = Object.keys(contentTypes)

  return contentTypeUids.reduce((sanitized, contentType) => {
    if (
      !(
        IGNORED_PLUGINS.includes(contentTypes[contentType].plugin) ||
        IGNORED_CONTENT_TYPES.includes(contentType)
      )
    ) {
      sanitized[contentType] = contentTypes[contentType]
    }
    return sanitized
  }, {})
}

export default ({ strapi }) => ({
  /**
   * Get all content types name being plugins or API's existing in Strapi instance.
   *
   * Content Types are formated like this: `type::apiName.contentType`.
   *
   * @returns {string[]} - list of all content types name.
   */
  getContentTypesUid() {
    const contentTypes = removeIgnoredAPIs({
      contentTypes: strapi.contentTypes,
    })

    return Object.keys(contentTypes)
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

    const contentTypeUid = contentTypeUids.find(uid => {
      return contentTypes[uid].modelName === contentType
    })

    return contentTypeUid
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
  getCollectionName({ contentType }) {
    const contentTypes = strapi.contentTypes
    const contentTypeUids = Object.keys(contentTypes)
    if (contentTypeUids.includes(contentType))
      return contentTypes[contentType].modelName

    return contentType
  },

  /**
   * Number of entries in a content type.
   *
   * @param  {object} options
   * @param  {string} options.contentType - Name of the contentType.
   * @param  {object} [options.filters] - Filter condition.
   * @param  {string} [options.status='published'] - Publication state.
   * @param  {string} [options.locale] - Locale to query.
   *
   * @returns  {Promise<number>} number of entries in the content type.
   */
  numberOfEntries: async function ({
    contentType,
    filters = {},
    status = 'published',
    locale,
  }) {
    const contentTypeUid = this.getContentTypeUid({ contentType })
    if (contentTypeUid === undefined) return 0
    const queryOptions = normalizeEntryScope({
      filters,
      status,
      locale,
    })

    try {
      if (queryOptions.locale === '*') {
        const batchCounts = await this.actionInBatches({
          contentType,
          entriesQuery: queryOptions,
          callback: ({ entries }) => entries.length,
        })

        return batchCounts.reduce((total, count) => total + count, 0)
      }

      const count = await strapi.documents(contentTypeUid).count(queryOptions)

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
   * @param  {object} [options.filters] - Filter condition.
   * @param  {string} [options.status='published'] - Publication state.
   * @param  {string} [options.locale] - Locale to query.
   *
   * @returns {Promise<number>} Total entries number of the content types.
   */
  totalNumberOfEntries: async function ({
    contentTypes,
    filters = {},
    status = 'published',
    locale,
  }) {
    const normalizedEntryScope = normalizeEntryScope({
      filters,
      status,
      locale,
    })
    let numberOfEntries = await Promise.all(
      contentTypes.map(async contentType =>
        this.numberOfEntries({
          contentType,
          ...normalizedEntryScope,
        }),
      ),
    )
    const entriesSum = numberOfEntries.reduce((acc, curr) => acc + curr, 0)
    return entriesSum
  },

  /**
   * Find an entry of a given content type.
   * More information: https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/entity-service/crud.html#findone
   *
   * @param  {object} options
   * @param  {string | number} [options.documentId] - DocumentId of the entry.
   * @param  {object} [options.entriesQuery={}] - Options to apply when fetching entries from the database.
   * @param  {string | string[]} [options.entriesQuery.fields] - Fields present in the returned entry.
   * @param  {object} [options.entriesQuery.populate] - Relations, components and dynamic zones to populate.
   * @param  {string} [options.entriesQuery.status] - Publication state: draft or published.
   * @param  {string} [options.entriesQuery.locale] - When using internationalization (i18n), the language to fetch.
   * @param  {string} options.contentType - Content type.
   *
   * @returns  {Promise<object|null>} - Entry, or null if not found.
   */
  async getEntry({ contentType, documentId, entriesQuery = {} }) {
    const {
      populate = '*',
      fields = '*',
      status = 'published',
      locale,
    } = entriesQuery
    const queryOptions = {
      documentId,
      fields,
      populate,
      status,
      locale: normalizeEntryLocale(locale),
    }
    const contentTypeUid = this.getContentTypeUid({ contentType })
    if (contentTypeUid === undefined) return null

    const entry = await strapi.documents(contentTypeUid).findOne(queryOptions)

    if (entry == null) {
      strapi.log.warn(
        `Could not find entry with documentId ${documentId} in ${contentType}`,
      )
      return null
    }

    return entry
  },

  /**
   * Returns a batch of entries of a given content type.
   * More information: https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/entity-service/crud.html#findmany
   *
   * @param  {object} options
   * @param  {string | string[]} [options.fields] - Fields present in the returned entry.
   * @param  {number} [options.start] - Pagination start.
   * @param  {number} [options.limit] - Number of entries to return.
   * @param  {object} [options.filters] - Filters to use.
   * @param  {object|string} [options.sort] - Order definition.
   * @param  {object} [options.populate] - Relations, components and dynamic zones to populate.
   * @param  {object} [options.status] - Publication state: draft or published.
   * @param  {string} options.contentType - Content type.
   * @param  {string} [options.locale] - When using internationalization (i18n), the language to fetch.
   *
   * @returns  {Promise<object[]>} - Entries.
   */
  async getEntries({
    contentType,
    fields = '*',
    start = 0,
    limit = 500,
    filters = {},
    sort = 'id',
    populate = '*',
    status = 'published',
    locale,
  }) {
    const contentTypeUid = this.getContentTypeUid({ contentType })
    if (contentTypeUid === undefined) return []
    const normalizedEntryScope = normalizeEntryScope({
      filters,
      status,
      locale,
    })

    const queryOptions = {
      fields: fields || '*',
      start,
      limit,
      filters: normalizedEntryScope.filters,
      sort,
      populate,
      status: normalizedEntryScope.status,
      locale: normalizedEntryScope.locale,
    }

    const entries = await strapi
      .documents(contentTypeUid)
      .findMany(queryOptions)

    // Safe guard in case the content-type is a single type.
    // In which case it is wrapped in an array for consistency.
    if (entries && !Array.isArray(entries)) return [entries]
    return entries || []
  },

  /**
   * Apply an action on all the entries of the provided content type.
   *
   * @param  {object} options
   * @param  {string} options.contentType - Name of the content type.
   * @param  {object} [options.entriesQuery] - Options to apply when fetching entries from the database.
   * @param  {function} options.callback - Function applied on each entry of the contentType.
   *
   * @returns {Promise<any[]>} - List of all the returned elements from the callback.
   */
  actionInBatches: async function ({
    contentType,
    callback = () => {},
    entriesQuery = {},
  }) {
    const normalizedEntryScope = normalizeEntryScope({
      filters: entriesQuery.filters,
      status: entriesQuery.status,
      locale: entriesQuery.locale,
    })
    const normalizedEntriesQuery = {
      ...entriesQuery,
      ...normalizedEntryScope,
    }
    const batchSize = normalizedEntriesQuery.limit || 500
    const shouldIterateUntilEmpty = normalizedEntriesQuery.locale === '*'
    let start = normalizedEntriesQuery.start || 0
    const cbResponse = []
    // Keep fetching until the source is exhausted because counts can be stale.
    while (true) {
      const entries =
        (await this.getEntries({
          start,
          limit: batchSize,
          contentType,
          ...normalizedEntriesQuery,
        })) || []

      if (entries.length === 0) break

      const info = await callback({ entries, contentType })
      if (Array.isArray(info)) cbResponse.push(...info)
      else if (info) cbResponse.push(info)

      if (!shouldIterateUntilEmpty && entries.length < batchSize) break
      start += batchSize
    }
    return cbResponse
  },
})
