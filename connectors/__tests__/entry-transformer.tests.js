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

const modelMock = {
  restaurant: {
    meilisearch: {
      indexName: 'my_restaurant',
      transformEntry: transformEntryMock,
    },
  },
}

const loggerMock = {
  warn: jest.fn(() => 'test'),
}

describe('Entry transformation', () => {
  let meilisearchConnector
  let storeConnector
  let collectionConnector
  beforeEach(async () => {
    // const { storeClientMock, servicesMock, modelMock } = mockInit()
    storeConnector = createStoreConnector({
      storeClient: storeClientMock,
    })
    collectionConnector = createCollectionConnector({
      logger: loggerMock,
      models: modelMock,
      services: servicesMock,
    })
    meilisearchConnector = await createMeiliSearchConnector({
      collectionConnector,
      storeConnector,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test if data is transformed correctly', async () => {
    const getIndexNameSpy = jest.spyOn(collectionConnector, 'getIndexName')
    const numberOfEntriesSpy = jest.spyOn(
      collectionConnector,
      'numberOfEntries'
    )
    const getEntriesBatchSpy = jest.spyOn(
      collectionConnector,
      'getEntriesBatch'
    )

    const transFormEntriesSpy = jest.spyOn(
      collectionConnector,
      'transformEntries'
    )
    await meilisearchConnector.addCollectionInMeiliSearch('restaurant')
    expect(servicesMock.restaurant.count).toHaveBeenCalledTimes(1)

    expect(numberOfEntriesSpy).toHaveBeenCalledWith('restaurant')
    expect(numberOfEntriesSpy).toHaveBeenCalledTimes(1)

    expect(getEntriesBatchSpy).toHaveBeenCalledWith({
      collection: 'restaurant',
      limit: 500,
      start: 0,
    })

    expect(getEntriesBatchSpy).toHaveBeenCalledTimes(1)
    expect(transFormEntriesSpy).toHaveBeenCalledTimes(1)
    expect(transFormEntriesSpy).toHaveBeenCalledWith({
      collection: 'restaurant',
      entries: [{ collection: [{ name: 'one' }, { name: 'two' }], id: '1' }],
    })
    expect(transFormEntriesSpy).toHaveReturnedWith([
      { collection: ['one', 'two'], id: '1' },
    ])

    expect(getIndexNameSpy).toHaveBeenCalledTimes(1)
    expect(getIndexNameSpy).toHaveBeenCalledWith('restaurant')
    // can only test returned with on sync functions
    expect(getIndexNameSpy).toHaveReturnedWith('my_restaurant')

    expect(addDocumentsMock).toHaveBeenCalledTimes(1)
    expect(addDocumentsMock).toHaveBeenCalledWith([
      { collection: ['one', 'two'], id: 'restaurant-1' },
    ])
  })
})
