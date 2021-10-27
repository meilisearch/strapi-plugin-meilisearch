const { MeiliSearch } = require('meilisearch')
const createMeiliSearchConnector = require('../../connectors/meilisearch')
const createStoreConnector = require('../../connectors/store')
const createCollectionConnector = require('../../connectors/collection')

jest.mock('meilisearch')

MeiliSearch.mockImplementation(() => {
  return {
    getOrCreateIndex: () => {
      return {
        index: () => ({
          addDocuments: jest.fn(() => 3),
        }),
      }
    },
    index: () => ({
      addDocuments: jest.fn(() => 3),
    }),
  }
})
const mockStoreClient = {
  set: jest.fn(() => 'test'),
  get: jest.fn(() => 'test'),
}

const mockServices = {
  restaurant: {
    count: jest.fn(() => 3),
    find: jest.fn(() => {
      return [{ id: '1' }]
    }),
  },
}

const mockModel = {
  restaurant: {
    searchIndexName: 'my_restaurant',
  },
}

describe('Tests if entries were correctly transformed', () => {
  let meilisearchConnector
  beforeAll(async () => {
    const storeConnector = createStoreConnector({
      storeClient: mockStoreClient,
    })
    const collectionConnector = createCollectionConnector({
      models: mockModel,
      services: mockServices,
    })
    meilisearchConnector = await createMeiliSearchConnector({
      collectionConnector,
      storeConnector,
    })
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('test', async () => {
    await meilisearchConnector.addCollectionInMeiliSearch('restaurant')
    expect(mockServices.restaurant.count).toHaveBeenCalledTimes(1)
  })
})
