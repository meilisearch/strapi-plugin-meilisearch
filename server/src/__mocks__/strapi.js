import defaultContentTypes from '../__tests__/utils/content-types-list'

const mockLogger = {
  error: jest.fn(() => {}),
  info: jest.fn(() => {}),
  warn: jest.fn(() => {}),
}

/**
 * @param {object} config
 * @param  {object} [config.restaurantConfig]
 * @param  {object} [config.aboutConfig]
 * @param  {object} [config.contentTypes]
 */
function createStrapiMock({
  restaurantConfig = {},
  aboutConfig = {},
  contentTypes,
}) {
  contentTypes = contentTypes || defaultContentTypes

  const mockPlugin = jest.fn(() => ({
    service: mockPluginService,
  }))

  const mockActionInBatches = jest.fn(() => {
    return [{ id: '1' }]
  })

  const mockAddIndexedContentType = jest.fn(() => {})

  const mockPluginService = jest.fn(() => {
    return {
      getContentTypesUid: () => ['restaurant', 'about'],
      getContentTypeUid: ({ contentType }) => contentType,
      getCollectionName: ({ contentType }) => contentType,
      getCredentials: () => ({
        host: 'http://localhost:7700',
        apiKey: 'masterKey',
        ApiKeyIsFromConfigFile: true,
        HostIsFromConfigFile: true,
      }),
      getIndexedContentTypes: () => [
        'api::restaurant.restaurant',
        'api::about.about',
      ],
      actionInBatches: mockActionInBatches,
      addIndexedContentType: mockAddIndexedContentType,
      subscribeContentType: () => {
        return
      },
      // Add methods for Meilisearch operations
      addEntriesToMeilisearch: jest.fn(),
      updateEntriesInMeilisearch: jest.fn(),
      deleteEntriesFromMeiliSearch: jest.fn(),
    }
  })

  const mockConfig = {
    get: jest.fn(() => {
      return {
        restaurant: restaurantConfig,
        about: aboutConfig,
      }
    }),
  }

  const mockFindWithCount = jest.fn(() => {
    return 1
  })
  const mockDb = {
    lifecycles: {
      subscribe: jest.fn(),
    },
    query: jest.fn(() => ({
      count: mockFindWithCount,
    })),
  }

  const mockFindMany = jest.fn(() => {
    return [{ id: 1 }]
  })

  const mockFindOne = jest.fn(() => {
    return [{ id: 1 }]
  })

  const mockDocumentService = jest.fn(() => {
    return {
      findMany: mockFindMany,
      findOne: mockFindOne,
      count: mockFindWithCount,
    }
  })

  const mockDocumentsUse = jest.fn()
  const mockDocuments = Object.assign(mockDocumentService, {
    use: mockDocumentsUse,
  })

  const mockStrapi = {
    log: mockLogger,
    plugin: mockPlugin,
    contentTypes,
    config: mockConfig,
    db: mockDb,
    documents: mockDocuments,
  }
  return mockStrapi
}

export { createStrapiMock, mockLogger }
