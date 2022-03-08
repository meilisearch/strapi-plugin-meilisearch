const createMeilisearchService = require('../services/meilisearch')

const { createFakeStrapi } = require('./utils/fakes')

const fakeStrapi = createFakeStrapi({})
global.strapi = fakeStrapi

describe('Test Meilisearch plugin configurations', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test with no meilisearch configurations', async () => {
    const customStrapi = createFakeStrapi({})

    const collection = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })
    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test with empty meilisearch configurations', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {},
    })

    const collection = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })
    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test with wrong type meilisearch configurations', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: 1,
    })

    const collection = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })
    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration undefined indexName', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {},
    })

    const collection = 'customName'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })

    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with non-empty type indexName', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        indexName: 'customName',
      },
    })

    const collection = 'customName'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })

    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with undefined transformEntry ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        transformEntry: undefined,
      },
    })

    const collection = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })
    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with correct transformEntry ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        transformEntry: ({ entry }) => {
          return {
            ...entry,
            name: 'hello',
          }
        },
      },
    })

    const collection = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })
    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([
      { id: 1, name: 'hello' },
      { id: 2, name: 'hello' },
    ])
    expect(settings).toEqual({})
  })

  test('Test configuration with correct filterEntry ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        filterEntry: ({ entry }) => {
          return entry.id !== 1
        },
      },
    })

    const collection = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })
    const entries = meilisearchService.filterEntries({
      collection,
      entries: [
        { id: 1, name: 'one' },
        { id: 2, name: 'two' },
      ],
    })

    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([{ id: 2, name: 'two' }])
    expect(settings).toEqual({})
  })

  test('Test configuration with throwing transformEntry ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        transformEntry: () => {
          throw new Error('failed')
        },
      },
    })

    const collection = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })
    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([])
    expect(settings).toEqual({})
  })

  test('Test configuration with no return transformEntry ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        transformEntry: () => {},
      },
    })

    const collection = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })
    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([])
    expect(settings).toEqual({})
  })

  test('Test configuration with empty settings ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        settings: {},
      },
    })

    const collection = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })
    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([{ id: 1 }, { id: 2 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with undefined settings ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        settings: undefined,
      },
    })

    const collection = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })
    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([{ id: 1 }, { id: 2 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with correct settings ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        settings: {
          mySettings: 'hello',
        },
      },
    })

    const collection = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexName = meilisearchService.getIndexNameOfCollection({
      collection,
    })
    const entries = meilisearchService.transformEntries({
      collection,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      collection,
    })

    expect(indexName).toEqual(collection)
    expect(entries).toEqual([{ id: 1 }, { id: 2 }])
    expect(settings).toEqual({
      mySettings: 'hello',
    })
  })

  test('Test all collections pointing to the same custom index name', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        indexName: 'my_index',
      },
      aboutConfig: {
        indexName: 'my_index',
      },
    })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const collections = meilisearchService.listCollectionsWithCustomIndexName({
      indexName: 'my_index',
    })

    expect(collections).toEqual(['restaurant', 'about'])
  })
})
