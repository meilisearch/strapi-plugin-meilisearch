import { isObject } from '../utils'
/**
 * Validate and cleans the DB query settings.
 * These will be used when fetching documents from the user's database.
 *
 *
 * @param  {object} options
 * @param  {string} options.collectionName
 * @param  {object} options.configuration
 * @param  {string[]} options.configuration.fields
 * @param  {any} options.configuration.filters
 * @param  {number} options.configuration.start
 * @param  {number} options.configuration.limit
 * @param  {any} options.configuration.sort
 * @param  {any} options.configuration.populate
 * @param  {any} options.configuration.status
 * @param  {any} options.configuration.locale
 *
 * @returns {object} - All validating functions
 *
 */
function EntriesQuery({ configuration, collectionName }) {
  const log = strapi.log // has to be inside a scope
  const {
    fields,
    filters,
    start,
    limit,
    sort,
    populate,
    status,
    locale,
    ...unknownKeys
  } = configuration

  const options = {}

  return {
    validateFields() {
      if (fields !== undefined && !Array.isArray(fields)) {
        log.error(
          `The "fields" option in "queryOptions" of "${collectionName}" should be an array of strings.`,
        )
      } else if (fields !== undefined) {
        options.fields = fields
      }

      return this
    },

    validateFilters() {
      if (filters !== undefined && !isObject(filters)) {
        log.error(
          `The "filters" option in "queryOptions" of "${collectionName}" should be an object.`,
        )
      } else if (filters !== undefined) {
        options.filters = filters
      }

      return this
    },

    validateStart() {
      if (start !== undefined) {
        log.error(
          `The "start" option in "queryOptions" of "${collectionName}" is forbidden.`,
        )
      }

      return this
    },

    validateLimit() {
      if (limit !== undefined && (isNaN(limit) || limit < 1)) {
        log.error(
          `The "limit" option in "queryOptions" of "${collectionName}" should be a number higher than 0.`,
        )
      } else if (limit !== undefined) {
        options.limit = limit
      }

      return this
    },

    validateSort() {
      // Sort is either undefined or an object/array/string
      if (
        sort !== undefined &&
        !isObject(sort) &&
        !Array.isArray(sort) &&
        typeof sort !== 'string'
      ) {
        log.error(
          `The "sort" option in "queryOptions" of "${collectionName}" should be an object/array/string.`,
        )
      } else if (sort !== undefined) {
        options.sort = sort
      }

      return this
    },

    validatePopulate() {
      // Populate is either undefined or an object/array/string
      if (
        populate !== undefined &&
        !isObject(populate) &&
        !Array.isArray(populate) &&
        typeof populate !== 'string'
      ) {
        log.error(
          `The "populate" option in "queryOptions" of "restaurant" should be an object/array/string.`,
        )
      } else if (populate !== undefined) {
        options.populate = populate
      }

      return this
    },

    validateStatus() {
      if (
        status !== undefined &&
        status !== 'draft' &&
        status !== 'published'
      ) {
        log.error(
          `The "status" option in "queryOptions" of "${collectionName}" should be either "draft" or "published".`,
        )
      } else if (status !== undefined) {
        options.status = status
      }

      return this
    },

    validateLocale() {
      // locale is either undefined or a non-empty string
      if (
        (locale !== undefined && typeof locale !== 'string') ||
        locale === ''
      ) {
        log.error(
          `The "locale" option in "queryOptions" of "${collectionName}" should be a non-empty string.`,
        )
      } else if (locale !== undefined) {
        options.locale = locale
      }

      return this
    },

    addUnknownKeys() {
      // Unknown fields
      Object.keys(unknownKeys).map(key => {
        log.error(
          `The "${key}" option in "queryOptions" of "${collectionName}" is not a known option. Check the "findMany" API references in the Strapi Documentation.`,
        )
      })

      return this
    },

    get() {
      return options
    },
  }
}

function CollectionConfig({ collectionName, configuration }) {
  const log = strapi.log // has to be inside a scope
  const {
    indexName,
    transformEntry,
    filterEntry,
    settings,
    entriesQuery,
    noSanitizePrivateFields,
    ...unknownFields
  } = configuration
  const options = {}

  return {
    validateIndexName() {
      // indexName is either undefined, a non-empty string, or a non-empty array of non-empty strings
      const isStringAndNotEmpty =
        typeof indexName === 'string' && indexName !== ''

      const isArrayWithNonEmptyStrings =
        Array.isArray(indexName) &&
        indexName.length > 0 &&
        indexName.every(name => typeof name === 'string' && name !== '')

      if (
        indexName !== undefined &&
        !(isStringAndNotEmpty || isArrayWithNonEmptyStrings)
      ) {
        log.error(
          `The "indexName" option of "${collectionName}" should be a non-empty string or an array of non-empty strings`,
        )
      } else if (indexName !== undefined) {
        options.indexName = indexName
      }

      return this
    },

    validateTransformEntry() {
      // transformEntry is either undefined or a function
      if (
        transformEntry !== undefined &&
        typeof transformEntry !== 'function'
      ) {
        log.error(
          `The "transformEntry" option of "${collectionName}" should be a function`,
        )
      } else if (transformEntry !== undefined) {
        options.transformEntry = transformEntry
      }

      return this
    },

    validateFilterEntry() {
      // filterEntry is either undefined or a function
      if (filterEntry !== undefined && typeof filterEntry !== 'function') {
        log.error(
          `The "filterEntry" option of "${collectionName}" should be a function`,
        )
      } else if (filterEntry !== undefined) {
        options.filterEntry = filterEntry
      }

      return this
    },

    validateMeilisearchSettings() {
      // Settings is either undefined or an object
      if (settings !== undefined && !isObject(settings)) {
        log.error(
          `The "settings" option of "${collectionName}" should be an object`,
        )
      } else if (settings !== undefined) {
        options.settings = settings
      }

      return this
    },

    validateEntriesQuery() {
      if (entriesQuery !== undefined && !isObject(entriesQuery)) {
        log.error(
          `The "entriesQuery" option of "${collectionName}" should be an object`,
        )
      } else if (entriesQuery !== undefined) {
        options.entriesQuery = EntriesQuery({
          configuration: entriesQuery,
          collectionName,
        })
          .validateFields()
          .validateFilters()
          .validateStart()
          .validateLimit()
          .validateSort()
          .validatePopulate()
          .validateStatus()
          .validateLocale()
          .addUnknownKeys()
          .get()
      }

      return this
    },
    validateNoSanitizePrivateFields() {
      // noSanitizePrivateFields is either undefined or an array
      if (
        noSanitizePrivateFields !== undefined &&
        !Array.isArray(noSanitizePrivateFields)
      ) {
        log.error(
          `The "noSanitizePrivateFields" option of "${collectionName}" should be an array of strings.`,
        )
      } else if (noSanitizePrivateFields !== undefined) {
        options.noSanitizePrivateFields = noSanitizePrivateFields
      }

      return this
    },

    validateNoInvalidKeys() {
      // Keys that should not be present in the configuration
      Object.keys(unknownFields).map(key => {
        log.warn(
          `The "${key}" option of "${collectionName}" is not a known option`,
        )
      })

      return this
    },

    get() {
      return options
    },
  }
}

function PluginConfig({ configuration }) {
  const log = strapi.log // has to be inside a scope
  // syncOptions is a reserved top-level key, not a collection name.
  const { apiKey, host, syncOptions, ...collections } = configuration
  const options = {}

  /**
   * Validate `syncOptions.retry`.
   *
   * @param {any} retry - Raw option value.
   *
   * @returns {{rule: string, maxQueueSize?: number} | undefined} Undefined disables the retry.
   */
  const validateRetry = retry => {
    const { rule, maxQueueSize, ...unknownFields } = isObject(retry)
      ? retry
      : {}
    // Shape check only (5 or 6 fields): a rule with invalid field values such
    // as "99 * * * *" passes here and is never scheduled by Strapi.
    if (
      !isObject(retry) ||
      typeof rule !== 'string' ||
      !/^\S+(\s+\S+){4,5}$/.test(rule.trim())
    ) {
      log.error(
        'The "syncOptions.retry" option should be an object with a "rule" string in cron format (5 or 6 fields, e.g. "*/5 * * * *"). Sync retry is disabled.',
      )
      return undefined
    }
    if (
      maxQueueSize !== undefined &&
      (!Number.isInteger(maxQueueSize) || maxQueueSize <= 0)
    ) {
      log.error(
        'The "syncOptions.retry.maxQueueSize" option should be a positive integer. Sync retry is disabled.',
      )
      return undefined
    }
    Object.keys(unknownFields).forEach(key => {
      log.warn(
        `The "${key}" option of "syncOptions.retry" is not a known option`,
      )
    })
    return maxQueueSize === undefined ? { rule } : { rule, maxQueueSize }
  }

  return {
    /**
     * Validate the reserved `syncOptions` key: undefined or an object of known
     * sync settings. An invalid value is dropped, an invalid `retry` removed.
     *
     * @returns {object} This validator, for chaining.
     */
    validateSyncOptions() {
      if (syncOptions === undefined) return this
      if (!isObject(syncOptions)) {
        log.error('The "syncOptions" option should be an object')
        options.syncOptions = undefined
        return this
      }

      const { retry, ...unknownFields } = syncOptions
      Object.keys(unknownFields).forEach(key => {
        log.warn(`The "${key}" option of "syncOptions" is not a known option`)
      })
      options.syncOptions =
        retry === undefined ? {} : { retry: validateRetry(retry) }
      if (options.syncOptions.retry === undefined) {
        delete options.syncOptions.retry
      }
      return this
    },

    validateApiKey() {
      // apiKey is either undefined or a string
      if (apiKey !== undefined && typeof apiKey !== 'string') {
        log.error('The "apiKey" option should be a string')
      } else if (apiKey !== undefined) {
        options.apiKey = apiKey
      }
      return this
    },

    validateHost() {
      // host is either undefined or a non-empty string
      if ((host !== undefined && typeof host !== 'string') || host === '') {
        log.error('The "host" option should be a non-empty string')
      } else if (host !== undefined) {
        options.host = host
      }
      return this
    },

    validateCollections() {
      // Iterate over all collections to validate their configuration
      for (const collection in collections) {
        if (!isObject(collections[collection])) {
          log.error(
            `The collection "${collection}" configuration should be of type object`,
          )
          options[collection] = {}
        } else {
          options[collection] = CollectionConfig({
            collectionName: collection,
            configuration: collections[collection],
          })
            .validateIndexName()
            .validateFilterEntry()
            .validateTransformEntry()
            .validateMeilisearchSettings()
            .validateEntriesQuery()
            .validateNoSanitizePrivateFields()
            .validateNoInvalidKeys()
            .get()
        }
      }
      return this
    },

    get() {
      return options
    },
  }
}

/**
 * Validates the plugin configuration provided in `plugins/config.js` of the users plugin configuration.
 * Modifies the value of config on place.
 *
 * @param  {object} configuration - The plugin configuration
 */
function validatePluginConfig(configuration) {
  const log = strapi.log

  // If no configuration, return
  if (configuration === undefined) {
    return
  } else if (configuration !== undefined && !isObject(configuration)) {
    log.error(
      'The "config" field in the Meilisearch plugin configuration should be an object',
    )
    return
  }

  const options = PluginConfig({ configuration })
    .validateApiKey()
    .validateHost()
    .validateSyncOptions()
    .validateCollections()
    .get()

  Object.assign(configuration, options)
  // An invalid syncOptions value is dropped; an invalid retry was already
  // removed from it, so the sync retry is off in both cases.
  if (configuration.syncOptions === undefined) {
    delete configuration.syncOptions
  }

  return configuration
}

export { validatePluginConfig }
