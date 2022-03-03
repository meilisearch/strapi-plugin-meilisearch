const createContentTypeService = require('../services/content-types')

const { createFakeStrapi } = require('./utils/fakes')

const fakeStrapi = createFakeStrapi({})
global.strapi = fakeStrapi

describe.skip('Test API configurations', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test with no meilisearch configurations', async () => {
    const customStrapi = createFakeStrapi({})

    const apiName = 'restaurant'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })
    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test with empty meilisearch configurations', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {},
    })

    const apiName = 'restaurant'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })
    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test with wrong type meilisearch configurations', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: 1,
    })

    const apiName = 'restaurant'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })
    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration undefined indexName', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {},
    })

    const apiName = 'customName'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })

    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with non-empty type indexName', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        indexName: 'customName',
      },
    })

    const apiName = 'customName'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })

    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with undefined transformEntry ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        transformEntry: undefined,
      },
    })

    const apiName = 'restaurant'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })
    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test.skip('Test configuration with correct transformEntry ', async () => {
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

    const apiName = 'restaurant'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })
    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
    expect(entries).toEqual([
      { id: 1, name: 'hello' },
      { id: 2, name: 'hello' },
    ])
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

    const apiName = 'restaurant'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })
    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
    expect(entries).toEqual([])
    expect(settings).toEqual({})
  })

  test('Test configuration with no return transformEntry ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        transformEntry: () => {},
      },
    })

    const apiName = 'restaurant'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })
    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
    expect(entries).toEqual([])
    expect(settings).toEqual({})
  })

  test('Test configuration with empty settings ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        settings: {},
      },
    })

    const apiName = 'restaurant'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })
    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
    expect(entries).toEqual([{ id: 1 }, { id: 2 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with undefined settings ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        settings: undefined,
      },
    })

    const apiName = 'restaurant'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })
    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
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

    const apiName = 'restaurant'
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })
    const indexName = contentTypeServices.getIndexNameOfCollection({
      apiName,
    })
    const entries = contentTypeServices.transformEntries({
      apiName,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = contentTypeServices.getSettings({
      apiName,
    })

    expect(indexName).toEqual(apiName)
    expect(entries).toEqual([{ id: 1 }, { id: 2 }])
    expect(settings).toEqual({
      mySettings: 'hello',
    })
  })

  test('Test fetch all APIs configurations', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        settings: {
          mySettings: 'hello',
        },
      },
      aboutConfig: {
        indexName: 'myIndex',
      },
    })

    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })

    const confs = contentTypeServices.getAllAPIservices()

    expect(confs.map(config => Object.keys(config)[0])).toEqual([
      'restaurant',
      'about',
    ])
  })

  test('Test fetch one API configuration', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        settings: {
          mySettings: 'hello',
        },
      },
      aboutConfig: {
        indexName: 'myIndex',
      },
    })

    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })

    const apiName = 'restaurant'
    const conf = contentTypeServices.getAPIServices({ apiName: apiName })
    expect(Object.keys(conf)[0]).toEqual('meilisearch')
  })
})
