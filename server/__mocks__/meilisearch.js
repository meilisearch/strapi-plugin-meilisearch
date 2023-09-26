const addDocumentsMock = jest.fn(() => 10)
const updateDocumentsMock = jest.fn(() => 10)
const updateSettingsMock = jest.fn(() => 10)
const deleteDocuments = jest.fn(() => {
  return [{ taskUid: 1 }, { taskUid: 2 }]
})
const getIndexUids = jest.fn(() => {
  return ['my_restaurant', 'restaurant']
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
  updateDocuments: updateDocumentsMock,
  updateSettings: updateSettingsMock,
  deleteDocuments,
  getStats,
}))

// @ts-ignore
const mock = jest.fn().mockImplementation(() => {
  return {
    getIndexUids,
    index: mockIndex,
    getTasks,
  }
})

module.exports = { MeiliSearch: mock }
