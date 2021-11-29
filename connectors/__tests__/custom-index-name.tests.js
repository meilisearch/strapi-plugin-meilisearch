const { MeiliSearch } = require('meilisearch')
const createMeiliSearchConnector = require('../meilisearch')
const createStoreConnector = require('../store')
const createCollectionConnector = require('../collection')

jest.mock('meilisearch')

const addDocumentsMock = jest.fn(() => 10)
const mockIndex = jest.fn(() => ({
  addDocuments: addDocumentsMock,
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

describe('Test custom index names', () => {
  let storeConnector
  beforeEach(async () => {
    jest.resetAllMocks()
    jest.clearAllMocks()
    jest.restoreAllMocks()
    storeConnector = createStoreConnector({
      storeClient: storeClientMock,
    })
  })

  test('Test custom index name', async () => {
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

    await meilisearchConnector.addCollectionInMeiliSearch('restaurant')

    expect(servicesMock.restaurant.count).toHaveBeenCalledTimes(1)

    expect(getIndexNameSpy).toHaveBeenCalledWith('restaurant')
    expect(getIndexNameSpy).toHaveReturnedWith('my_restaurant')
  })

  test('Test no custom index name', async () => {
    const modelMock = {
      restaurant: {
        meilisearch: {},
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

    await meilisearchConnector.addCollectionInMeiliSearch('restaurant')

    expect(servicesMock.restaurant.count).toHaveBeenCalledTimes(1)

    expect(getIndexNameSpy).toHaveBeenCalledWith('restaurant')
    expect(getIndexNameSpy).toHaveReturnedWith('restaurant')
  })

  test('Test no meilisearch setting', async () => {
    const modelMock = {
      restaurant: {},
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

    await meilisearchConnector.addCollectionInMeiliSearch('restaurant')

    expect(servicesMock.restaurant.count).toHaveBeenCalledTimes(1)

    expect(getIndexNameSpy).toHaveBeenCalledWith('restaurant')
    expect(getIndexNameSpy).toHaveReturnedWith('restaurant')
  })

  test('Test empty custom index name', async () => {
    const modelMock = {
      restaurant: {
        indexName: '', // ignored
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

    await meilisearchConnector.addCollectionInMeiliSearch('restaurant')

    expect(servicesMock.restaurant.count).toHaveBeenCalledTimes(1)

    expect(getIndexNameSpy).toHaveBeenCalledWith('restaurant')
    expect(getIndexNameSpy).toHaveReturnedWith('restaurant')
  })

  test('Test wrong type custom index name', async () => {
    const modelMock = {
      restaurant: {
        meilisearch: {
          indexName: { id: 1 }, // ignored
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

    await meilisearchConnector.addCollectionInMeiliSearch('restaurant')

    expect(servicesMock.restaurant.count).toHaveBeenCalledTimes(1)

    expect(getIndexNameSpy).toHaveBeenCalledWith('restaurant')

    // Check if warning has been raised.
    expect(loggerMock.warn).toHaveBeenCalledTimes(1)

    // Check if invalid indexName type is ignored.
    expect(getIndexNameSpy).toHaveReturnedWith('restaurant')
  })
})
