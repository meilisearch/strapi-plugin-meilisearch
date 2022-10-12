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
})
