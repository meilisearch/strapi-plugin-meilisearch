import bootstrap from '../bootstrap'
import { createStrapiMock, mockLogger } from '../__mocks__/strapi'

/**
 * Build a Strapi mock exposing the plugin services used by the bootstrap.
 *
 * @param {object} options
 * @param {Function} options.fetchIndexUids - Implementation of meilisearch.fetchIndexUids.
 * @param {string[]} options.indexedContentTypes - Content types stored as indexed.
 *
 * @returns {{ strapiMock: object, storeService: object, lifecycleService: object }} The Strapi mock and the services to assert on.
 */
function setup({ fetchIndexUids, indexedContentTypes }) {
  const strapiMock = createStrapiMock({})
  const storeService = {
    syncCredentials: jest.fn(),
    getIndexedContentTypes: jest.fn(async () => indexedContentTypes),
    removeIndexedContentType: jest.fn(),
    emptyListenedContentTypes: jest.fn(),
  }
  const lifecycleService = { subscribeContentType: jest.fn() }
  const meilisearchService = {
    fetchIndexUids: jest.fn(fetchIndexUids),
    getIndexNamesOfContentType: jest.fn(({ contentType }) => [
      contentType.split('.').pop(),
    ]),
  }
  const contentTypeService = {
    getContentTypesUid: jest.fn(() => indexedContentTypes),
  }

  const originalPlugin = strapiMock.plugin
  strapiMock.plugin = jest.fn(pluginName => {
    if (pluginName === 'meilisearch') {
      return {
        service: jest.fn(serviceName => {
          if (serviceName === 'store') return storeService
          if (serviceName === 'lifecycle') return lifecycleService
          if (serviceName === 'meilisearch') return meilisearchService
          if (serviceName === 'contentType') return contentTypeService
          return originalPlugin().service()
        }),
      }
    }
    return originalPlugin(pluginName)
  })
  // @ts-ignore
  strapiMock.admin = {
    services: {
      permission: { actionProvider: { registerMany: jest.fn() } },
    },
  }

  // @ts-ignore
  global.strapi = strapiMock

  return { strapiMock, storeService, lifecycleService }
}

describe('Bootstrap indexed collections sync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('keeps indexed collections and their listeners when Meilisearch is unreachable', async () => {
    const { strapiMock, storeService, lifecycleService } = setup({
      fetchIndexUids: async () => {
        throw new Error('Request to http://localhost:7700/stats has failed')
      },
      indexedContentTypes: ['api::restaurant.restaurant'],
    })

    await bootstrap({ strapi: strapiMock })

    expect(storeService.removeIndexedContentType).not.toHaveBeenCalled()
    expect(lifecycleService.subscribeContentType).toHaveBeenCalledWith({
      contentType: 'api::restaurant.restaurant',
    })
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('keeping indexed collections'),
    )
  })

  test('removes a collection whose index is missing in Meilisearch', async () => {
    const { strapiMock, storeService } = setup({
      fetchIndexUids: async () => ['about'],
      indexedContentTypes: ['api::restaurant.restaurant'],
    })

    await bootstrap({ strapi: strapiMock })

    expect(storeService.removeIndexedContentType).toHaveBeenCalledWith({
      contentType: 'api::restaurant.restaurant',
    })
  })

  test('keeps a collection whose index exists in Meilisearch', async () => {
    const { strapiMock, storeService, lifecycleService } = setup({
      fetchIndexUids: async () => ['restaurant'],
      indexedContentTypes: ['api::restaurant.restaurant'],
    })

    await bootstrap({ strapi: strapiMock })

    expect(storeService.removeIndexedContentType).not.toHaveBeenCalled()
    expect(lifecycleService.subscribeContentType).toHaveBeenCalledWith({
      contentType: 'api::restaurant.restaurant',
    })
  })
})
