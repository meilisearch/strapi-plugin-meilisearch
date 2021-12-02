const { MeiliSearch } = require('meilisearch')
const createMeiliSearchConnector = require('../meilisearch')
const createStoreConnector = require('../store')
const createCollectionConnector = require('../collection')

jest.mock('meilisearch')

const addDocumentsMock = jest.fn(() => 10)
const updateSettingsMock = jest.fn(() => 10)

const mockIndex = jest.fn(() => ({
  addDocuments: addDocumentsMock,
  updateSettings: updateSettingsMock,
}))

MeiliSearch.mockImplementation(() => {
  return {
    getOrCreateIndex: () => {
      return mockIndex
    },
    index: mockIndex,
  }
})

const storeClientMock = {
  set: jest.fn(() => 'test'),
  get: jest.fn(() => 'test'),
}

const servicesMock = {
  restaurant: {
    count: jest.fn(() => {
      return 11
    }),
    find: jest.fn(() => {
      return [{ id: '1', collection: [{ name: 'one' }, { name: 'two' }] }]
    }),
  },
}

const transformEntryMock = jest.fn(function ({ entry }) {
  const transformedEntry = {
    ...entry,
    collection: entry.collection.map(cat => cat.name),
  }
  return transformedEntry
})

const loggerMock = {
  warn: jest.fn(() => 'test'),
}

describe('Test MeiliSearch settings', () => {
  let storeConnector
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    storeConnector = createStoreConnector({
      storeClient: storeClientMock,
    })
  })

  test('Test not settings field in configuration', async () => {
    const modelMock = {
      restaurant: {
        meilisearch: {
          indexName: 'my_restaurant',
          transformEntry: transformEntryMock,
        },
      },
    }
    const collectionConnector = createCollectionConnector({
      logger: loggerMock,
      models: modelMock,
      services: servicesMock,
    })
    const meilisearchConnector = await createMeiliSearchConnector({
      collectionConnector,
      storeConnector,
    })
    const getIndexNameSpy = jest.spyOn(collectionConnector, 'getIndexName')
    const getSettingsSpy = jest.spyOn(collectionConnector, 'getSettings')

    await meilisearchConnector.addCollectionInMeiliSearch('restaurant')

    expect(servicesMock.restaurant.count).toHaveBeenCalledTimes(1)

    expect(getIndexNameSpy).toHaveBeenCalledWith('restaurant')
    expect(getIndexNameSpy).toHaveReturnedWith('my_restaurant')
    expect(getSettingsSpy).toHaveBeenCalledWith('restaurant')
    expect(getSettingsSpy).toHaveReturnedWith({})
  })

  test('Test a empty setting object in configuration', async () => {
    const modelMock = {
      restaurant: {
        meilisearch: {
          indexName: 'my_restaurant',
          transformEntry: transformEntryMock,
          settings: {},
        },
      },
    }
    const collectionConnector = createCollectionConnector({
      logger: loggerMock,
      models: modelMock,
      services: servicesMock,
    })
    const meilisearchConnector = await createMeiliSearchConnector({
      collectionConnector,
      storeConnector,
    })
    const getIndexNameSpy = jest.spyOn(collectionConnector, 'getIndexName')
    const getSettingsSpy = jest.spyOn(collectionConnector, 'getSettings')

    await meilisearchConnector.addCollectionInMeiliSearch('restaurant')

    expect(servicesMock.restaurant.count).toHaveBeenCalledTimes(1)

    expect(getIndexNameSpy).toHaveBeenCalledWith('restaurant')
    expect(getIndexNameSpy).toHaveReturnedWith('my_restaurant')
    expect(getSettingsSpy).toHaveBeenCalledWith('restaurant')
    expect(getSettingsSpy).toHaveReturnedWith({})
  })

  test('Test a setting object with one field in configuration', async () => {
    const modelMock = {
      restaurant: {
        meilisearch: {
          indexName: 'my_restaurant',
          transformEntry: transformEntryMock,
          settings: {
            searchableAttributes: ['*'],
          },
        },
      },
    }
    const collectionConnector = createCollectionConnector({
      logger: loggerMock,
      models: modelMock,
      services: servicesMock,
    })
    const meilisearchConnector = await createMeiliSearchConnector({
      collectionConnector,
      storeConnector,
    })
    const getIndexNameSpy = jest.spyOn(collectionConnector, 'getIndexName')
    const getSettingsSpy = jest.spyOn(collectionConnector, 'getSettings')

    await meilisearchConnector.addCollectionInMeiliSearch('restaurant')

    expect(servicesMock.restaurant.count).toHaveBeenCalledTimes(1)

    expect(getIndexNameSpy).toHaveBeenCalledWith('restaurant')
    expect(getIndexNameSpy).toHaveReturnedWith('my_restaurant')
    expect(getSettingsSpy).toHaveBeenCalledWith('restaurant')
    expect(getSettingsSpy).toHaveReturnedWith({ searchableAttributes: ['*'] })
  })
})
