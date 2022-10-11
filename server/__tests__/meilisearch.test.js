const createMeilisearchService = require('../services/meilisearch')

const { MeiliSearch: Meilisearch } = require('meilisearch')
const { createFakeStrapi } = require('./utils/fakes')

jest.mock('meilisearch')

const fakeStrapi = createFakeStrapi({})

// @ts-ignore
global.strapi = fakeStrapi

describe('Tests content types', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test get all contentTypes types', async () => {
    const customStrapi = createFakeStrapi({})

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const indexes = await meilisearchService.getIndexes()

    expect(indexes).toEqual([{ uid: 'my_restaurant' }, { uid: 'restaurant' }])
  })

  test('Test to delete entries from Meilisearch', async () => {
    const customStrapi = createFakeStrapi({
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
    expect(tasks).toEqual([{ uid: 1 }, { uid: 2 }])
  })

  test('Test to get stats', async () => {
    const customStrapi = createFakeStrapi({})

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
})
