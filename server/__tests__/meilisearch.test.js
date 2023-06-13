const createMeilisearchService = require('../services/meilisearch')

const { MeiliSearch: Meilisearch } = require('meilisearch')
const { createStrapiMock } = require('../__mocks__/strapi')

jest.mock('meilisearch')

const strapiMock = createStrapiMock({})

// @ts-ignore
global.strapi = strapiMock

describe('Tests content types', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test get all contentTypes types', async () => {
    const customStrapi = createStrapiMock({})

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const indexes = await meilisearchService.getIndexes()

    expect(indexes).toEqual([{ uid: 'my_restaurant' }, { uid: 'restaurant' }])
  })

  test('Test to delete entries from Meilisearch', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: 'customIndex',
      },
    })

    // Spy
    const client = new Meilisearch({ host: 'abc' })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const tasks = await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      entriesId: [1, 2],
    })
    expect(client.index('').deleteDocuments).toHaveBeenCalledTimes(1)
    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-1',
      'restaurant-2',
    ])
    expect(client.index).toHaveBeenCalledWith('customIndex')
    expect(tasks).toEqual([{ taskUid: 1 }, { taskUid: 2 }])
  })

  test('Test to get stats', async () => {
    const customStrapi = createStrapiMock({})

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const stats = await meilisearchService.getStats({
      indexUid: 'restaurant',
    })
    expect(stats).toEqual({
      numberOfDocuments: 1,
      isIndexing: false,
      fieldDistribution: {},
    })
  })

  test('Test to update the content of a collection in Meilisearch', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        entriesQuery: {
          limit: 1,
          fields: ['id'],
          filters: {},
          sort: {},
          populate: [],
          publicationState: 'preview',
        },
      },
    })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    await meilisearchService.addContentTypeInMeiliSearch({
      contentType: 'restaurant',
    })

    expect(
      customStrapi.plugin().service().actionInBatches
    ).toHaveBeenCalledWith({
      contentType: 'restaurant',
      callback: expect.anything(),
      entriesQuery: {
        limit: 1,
        fields: ['id'],
        filters: {},
        sort: {},
        populate: [],
        publicationState: 'preview',
      },
    })
  })

  test('sanitizes the private fields from the entries', async () => {
    const pluginMock = jest.fn(() => ({
      // This rewrites only the needed methods to reach the system under test (removeSensitiveFields)
      service: jest.fn().mockImplementation(() => {
        return {
          async actionInBatches({ contentType = 'restaurant', callback }) {
            await callback({
              entries: [
                { id: 1, title: 'title', secret: '123' },
                { id: 2, title: 'abc', secret: '234' },
              ],
              contentType,
            })
          },
          getCollectionName: ({ contentType }) => contentType,
          addIndexedContentType: jest.fn(),
          subscribeContentType: jest.fn(),
          getCredentials: () => ({}),
        }
      }),
    }))

    const service = createMeilisearchService({
      strapi: {
        plugin: pluginMock,
        contentTypes: {
          restaurant: {
            attributes: {
              id: { private: false },
              title: { private: false },
              secret: { private: true },
            },
          },
        },
        config: { get: jest.fn(() => ({ restaurant: jest.fn() })) },
      },
    })

    await service.addContentTypeInMeiliSearch({ contentType: 'restaurant' })

    expect(Meilisearch().index).toHaveBeenCalledWith('restaurant')
    expect(Meilisearch().index().addDocuments).toHaveBeenNthCalledWith(
      1,
      [
        {
          _meilisearch_id: 'restaurant-1',
          id: 1,
          title: 'title',
        },
        {
          _meilisearch_id: 'restaurant-2',
          id: 2,
          title: 'abc',
        },
      ],
      { primaryKey: '_meilisearch_id' }
    )
  })
})
