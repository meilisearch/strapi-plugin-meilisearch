import { isObject } from "./utils/type-checking"

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
 * @param  {any} options.configuration.publicationState
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
    publicationState,
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

    validatePublicationState() {
      if (
        publicationState !== undefined &&
        publicationState !== 'live' &&
        publicationState !== 'preview'
      ) {
        log.error(
          `The "publicationState" option in "queryOptions" of "${collectionName}" should be either "preview" or "live".`,
        )
      } else if (publicationState !== undefined) {
        options.publicationState = publicationState
      }

      return this
    },

    validateLocale() {
      // locale is either undefined or a none empty string
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
          .validatePublicationState()
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
  const { apiKey, host, ...collections } = configuration
  const options = {}

  return {
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
      // apiKey is either undefined or a none empty string
      if ((host !== undefined && typeof host !== 'string') || host === '') {
        log.error('The "host" option should be a non-empty string')
      } else if (host !== undefined) {
        options.host = host
      }
      return this
    },

    validateCollections() {
      // Itterate over all collections to validate their configuration
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
    .validateCollections()
    .get()

  Object.assign(configuration, options)

  return configuration
}

export default {
  validatePluginConfig,
}