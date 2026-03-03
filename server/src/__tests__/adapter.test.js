import createAdapterService from '../services/meilisearch/adapter.js'

describe('Meilisearch Adapter', () => {
  const strapi = {
    log: { warn: jest.fn() },
    plugin: jest.fn(() => ({
      service: jest.fn(() => ({
        getCollectionName: () => 'restaurant',
      })),
    })),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('addCollectionNamePrefixToId uses documentId', () => {
    const adapter = createAdapterService({ strapi })
    const result = adapter.addCollectionNamePrefixToId({
      contentType: 'api::restaurant.restaurant',
      entryDocumentId: 'abc123',
    })
    expect(result).toBe('restaurant-abc123')
  })

  test('addCollectionNamePrefix maps entries using documentId', () => {
    const adapter = createAdapterService({ strapi })
    const entries = [
      { id: 1, documentId: 'abc123', title: 'Test' },
      { id: 2, documentId: 'def456', title: 'Test 2' },
    ]
    const result = adapter.addCollectionNamePrefix({
      contentType: 'api::restaurant.restaurant',
      entries,
    })
    expect(result[0]._meilisearch_id).toBe('restaurant-abc123')
    expect(result[1]._meilisearch_id).toBe('restaurant-def456')
  })

  test('addCollectionNamePrefix skips entries with null documentId and warns', () => {
    const adapter = createAdapterService({ strapi })
    const entries = [
      { id: 1, documentId: null, title: 'Bad entry' },
      { id: 2, documentId: 'def456', title: 'Good entry' },
    ]
    const result = adapter.addCollectionNamePrefix({
      contentType: 'api::restaurant.restaurant',
      entries,
    })
    expect(result).toHaveLength(1)
    expect(result[0]._meilisearch_id).toBe('restaurant-def456')
    expect(strapi.log.warn).toHaveBeenCalledWith(
      'Entry in api::restaurant.restaurant is missing documentId, skipping indexing for this entry',
    )
  })

  test('addCollectionNamePrefix skips entries with undefined documentId and warns', () => {
    const adapter = createAdapterService({ strapi })
    const entries = [{ id: 1, title: 'No documentId field' }]
    const result = adapter.addCollectionNamePrefix({
      contentType: 'api::restaurant.restaurant',
      entries,
    })
    expect(result).toHaveLength(0)
    expect(strapi.log.warn).toHaveBeenCalledTimes(1)
  })
})
