import createLifecycle from '../services/lifecycle/lifecycle.js'
import { createStrapiMock } from '../__mocks__/strapi'

describe('Lifecycle subscribeContentType', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  const setup = ({ getContentTypeUidReturn } = {}) => {
    const strapiMock = createStrapiMock({})
    const storeService = {
      addListenedContentType: jest.fn(),
    }
    const contentTypeService = {
      getContentTypeUid: jest.fn(() => getContentTypeUidReturn),
    }

    const originalPlugin = strapiMock.plugin
    strapiMock.plugin = jest.fn(pluginName => {
      if (pluginName === 'meilisearch') {
        return {
          service: jest.fn(serviceName => {
            if (serviceName === 'store') return storeService
            if (serviceName === 'contentType') return contentTypeService
            return originalPlugin().service()
          }),
        }
      }
      return originalPlugin(pluginName)
    })

    return { strapiMock, storeService, contentTypeService }
  }

  test('adds content type to listened store and skips DB lifecycles', async () => {
    const contentType = 'api::restaurant.restaurant'
    const { strapiMock, storeService, contentTypeService } = setup({
      getContentTypeUidReturn: contentType,
    })

    const lifecycle = createLifecycle({ strapi: strapiMock })
    await lifecycle.subscribeContentType({ contentType })

    expect(contentTypeService.getContentTypeUid).toHaveBeenCalledWith({
      contentType,
    })
    expect(storeService.addListenedContentType).toHaveBeenCalledWith({
      contentType,
    })
    expect(strapiMock.db.lifecycles.subscribe).not.toHaveBeenCalled()
  })

  test('no-ops when content type UID cannot be resolved', async () => {
    const { strapiMock, storeService, contentTypeService } = setup({
      getContentTypeUidReturn: undefined,
    })

    const lifecycle = createLifecycle({ strapi: strapiMock })
    await lifecycle.subscribeContentType({ contentType: 'unknown' })

    expect(contentTypeService.getContentTypeUid).toHaveBeenCalledWith({
      contentType: 'unknown',
    })
    expect(storeService.addListenedContentType).not.toHaveBeenCalled()
    expect(strapiMock.db.lifecycles.subscribe).not.toHaveBeenCalled()
  })
})
