const { MeiliSearch } = require('meilisearch')
const createMeiliSearchConnector = require('../../connectors/meilisearch')
const createStoreConnector = require('../../connectors/store')
const createCollectionConnector = require('../../connectors/collection')

jest.mock('meilisearch')

function mockInit() {
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
  const transformEntryMock = jest.fn(function (entry) {
    console.log('BAH ALORS 5')
    const transformedEntry = {
      ...entry,
      // categories: entry.categories.map(cat => cat.name),
    }
    return transformedEntry
  })

  const modelMock = {
    restaurant: {
      searchIndexName: 'my_restaurant',
      transformEntry: transformEntryMock,
    },
  }
  return { storeClientMock, modelMock, servicesMock }
}
describe('Entry transformation', () => {
  let meilisearchConnector
  let storeConnector
  let collectionConnector
  beforeEach(async () => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
    jest.clearAllMocks()
    const { storeClientMock, servicesMock, modelMock } = mockInit()
    storeConnector = createStoreConnector({
      storeClient: storeClientMock,
    })
    collectionConnector = createCollectionConnector({
      models: modelMock,
      services: servicesMock,
    })
    meilisearchConnector = await createMeiliSearchConnector({
      collectionConnector,
      storeConnector,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
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
    // expect(servicesMock.restaurant.count).toHaveBeenCalledTimes(1)

    expect(numberOfEntriesSpy).toHaveBeenCalledWith('restaurant')
    expect(numberOfEntriesSpy).toHaveBeenCalledTimes(1)

    expect(getEntriesBatchSpy).toHaveBeenCalledWith({
      collection: 'restaurant',
      limit: 1000,
      start: 0,
    })
    expect(getEntriesBatchSpy).toHaveBeenCalledTimes(1)

    expect(transFormEntriesSpy).toHaveBeenCalledTimes(1)
    expect(transFormEntriesSpy).toHaveBeenCalledWith('restaurant', [
      { collection: ['one', 'two'], id: '1' },
    ])
    expect(transFormEntriesSpy).toHaveReturnedWith([{ id: '1' }])

    expect(getIndexNameSpy).toHaveBeenCalledTimes(2)
    expect(getIndexNameSpy).toHaveBeenCalledWith('restaurant')
    // can only test returned with on sync functions
    expect(getIndexNameSpy).toHaveReturnedWith('my_restaurant')

    // expect(addDocumentsMock).toHaveBeenCalledTimes(1)
    // expect(addDocumentsMock).toHaveBeenCalledWith([
    //   { collection: [{ name: 'one' }, { name: 'two' }], id: '1' },
    // ])

    // expect(addDocumentsMock).toHaveBeenCalledTimes(1)
    // expect(addDocumentsMock).toHaveBeenCalledWith([
    //   { collection: [{ name: 'one' }, { name: 'two' }], id: '1' },
    // ])
  })
})
