const createMeilisearchService = require('../services/meilisearch')

const { createFakeStrapi } = require('./utils/fakes')
const { MeiliSearch: Meilisearch } = require('meilisearch')

jest.mock('meilisearch')

const fakeStrapi = createFakeStrapi({})

const addDocumentsMock = jest.fn(() => 10)
const updateSettingsMock = jest.fn(() => 10)
const deleteDocuments = jest.fn(() => {
  return [{ uid: 1 }, { uid: 2 }]
})
const getIndexes = jest.fn(() => {
  return [{ uid: 'my_restaurant' }, { uid: 'restaurant' }]
})

const getTasks = jest.fn(() => {
  return {
    results: [
      { uid: 1, status: 'enqueued', indexUid: 'restaurant' },
      { uid: 2, status: 'processed', indexUid: 'restaurant' },
      { uid: 3, status: 'enqueued', indexUid: 'about' },
    ],
  }
})

const getStats = jest.fn(() => {
  return { numberOfDocuments: 1, isIndexing: false, fieldDistribution: {} }
})

const mockIndex = jest.fn(() => ({
  addDocuments: addDocumentsMock,
  updateSettings: updateSettingsMock,
  deleteDocuments,
  getStats,
}))

// @ts-ignore
Meilisearch.mockImplementation(() => {
  return {
    getIndexes,
    index: mockIndex,
    getTasks,
  }
})

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

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const tasks = await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      entriesId: [1, 2],
    })
    expect(deleteDocuments).toHaveBeenCalledTimes(1)
    expect(deleteDocuments).toHaveBeenCalledWith([
      'restaurant-1',
      'restaurant-2',
    ])
    expect(mockIndex).toHaveBeenCalledWith('customIndex')
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
