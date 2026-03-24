import createMeilisearchService from '../../services/meilisearch'
import { mockLogger } from '../../__mocks__/strapi'

export const localeAwareContentTypes = {
  restaurant: {
    attributes: {
      id: { private: false },
      documentId: { private: false },
      locale: { private: false },
      title: { private: false },
      publishedAt: { private: false },
    },
  },
}

/**
 * Build a reusable Strapi/Meilisearch fixture focused on localization rules.
 * @param {object} [options]
 * @param {string} [options.contentType=restaurant]
 * @param {object} [options.entriesQuery={ locale: '*' }]
 * @param {string | string[]} [options.indexNames]
 * @param {object} [options.extraConfig]
 * @param {Function} [options.getEntriesMock]
 */
export const createLocaleMeilisearchContext = ({
  contentType = 'restaurant',
  entriesQuery = { locale: '*' },
  indexNames,
  extraConfig = {},
  getEntriesMock,
} = {}) => {
  const collectionName = contentType

  // Build the per-content type config used by configurationService.
  const configuredType =
    indexNames !== undefined
      ? {
          ...extraConfig,
          entriesQuery: { ...entriesQuery },
          indexName: indexNames,
        }
      : { ...extraConfig, entriesQuery: { ...entriesQuery } }

  const pluginConfig = {
    [collectionName]: configuredType,
  }

  const configGet = jest.fn(() => pluginConfig)

  const entriesFetcher = getEntriesMock ?? jest.fn(async () => [])

  const contentTypeService = {
    getCollectionName: jest.fn(() => collectionName),
    getContentTypeUid: jest.fn(() => contentType),
    getContentTypesUid: jest.fn(() => [contentType]),
    getEntries: jest.fn(async params => entriesFetcher(params)),
    totalNumberOfEntries: jest.fn(async () => 0),
    actionInBatches: jest.fn(async params => {
      const { callback } = params || {}
      if (typeof callback !== 'function') return []
      const entries = await entriesFetcher(params)
      return callback({ entries, contentType })
    }),
  }

  const storeService = {
    getCredentials: jest.fn(async () => ({
      host: 'http://localhost:7700',
      apiKey: 'masterKey',
    })),
    getIndexedContentTypes: jest.fn(async () => []),
    getListenedContentTypes: jest.fn(async () => []),
    addIndexedContentType: jest.fn(async () => {}),
    removeIndexedContentType: jest.fn(async () => {}),
    addListenedContentType: jest.fn(async () => {}),
    emptyListenedContentTypes: jest.fn(async () => {}),
    syncCredentials: jest.fn(async () => {}),
  }

  const lifecycleService = {
    subscribeContentType: jest.fn(async () => {}),
  }

  const pluginService = jest.fn(serviceName => {
    if (serviceName === 'store') return storeService
    if (serviceName === 'contentType') return contentTypeService
    if (serviceName === 'lifecycle') return lifecycleService
    return {}
  })

  const strapi = {
    plugin: jest.fn(() => ({ service: pluginService })),
    config: { get: configGet },
    contentTypes: localeAwareContentTypes,
    log: mockLogger,
  }

  const meilisearchService = createMeilisearchService({ strapi })

  return {
    strapi,
    meilisearchService,
    contentTypes: localeAwareContentTypes,
    contentTypeService,
    configGet,
    storeService,
    lifecycleService,
    getEntriesMock: entriesFetcher,
  }
}
