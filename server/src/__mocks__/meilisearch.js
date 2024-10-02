const addDocumentsMock = jest.fn(() => 10)
const updateDocumentsMock = jest.fn(() => 10)
const updateSettingsMock = jest.fn(() => 10)
const deleteDocuments = jest.fn(() => {
  return [{ taskUid: 1 }, { taskUid: 2 }]
})
const getStats = jest.fn(() => {
  return {
    databaseSize: 447819776,
    lastUpdate: '2019-11-15T11:15:22.092896Z',
    indexes: {
      my_restaurant: {
        numberOfDocuments: 1,
        isIndexing: false,
        fieldDistribution: {},
      },
      restaurant: {
        numberOfDocuments: 1,
        isIndexing: false,
        fieldDistribution: {},
      },
    },
  }
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

const getIndexStats = jest.fn(() => {
  return { numberOfDocuments: 1, isIndexing: false, fieldDistribution: {} }
})

const mockIndex = jest.fn(() => ({
  addDocuments: addDocumentsMock,
  updateDocuments: updateDocumentsMock,
  updateSettings: updateSettingsMock,
  deleteDocuments,
  getStats: getIndexStats,
}))

// @ts-ignore
const mock = jest.fn().mockImplementation(() => {
  return {
    getStats,
    index: mockIndex,
    getTasks,
  }
})

export const MeiliSearch = mock
