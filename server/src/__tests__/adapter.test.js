import createAdapterService from '../services/meilisearch/adapter.js'

describe('Meilisearch Adapter', () => {
  const strapi = {
    plugin: jest.fn(() => ({
      service: jest.fn(() => ({
        getCollectionName: () => 'restaurant',
      })),
    })),
  }

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
})
