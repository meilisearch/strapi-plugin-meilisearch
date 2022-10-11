const addDocumentsMock = jest.fn(() => 10)
const updateSettingsMock = jest.fn(() => 10)
const deleteDocuments = jest.fn(() => {
  return [{ uid: 1 }, { uid: 2 }]
})
const getIndexes = jest.fn(() => {
  console.log('plouf')
  return { results: [{ uid: 'my_restaurant' }, { uid: 'restaurant' }] }
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
const mock = jest.fn().mockImplementation(() => {
  return {
    getIndexes,
    index: mockIndex,
    getTasks,
  }
})

module.exports = { MeiliSearch: mock }
