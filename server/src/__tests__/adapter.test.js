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

  test('addCollectionNamePrefixToId handles locale fallback and unique suffixes', () => {
    const adapter = createAdapterService({ strapi })

    const undefinedLocaleId = adapter.addCollectionNamePrefixToId({
      contentType: 'api::restaurant.restaurant',
      entryDocumentId: 'abc123',
      locale: undefined,
    })
    expect(undefinedLocaleId).toBe('restaurant-abc123')

    const enId = adapter.addCollectionNamePrefixToId({
      contentType: 'api::restaurant.restaurant',
      entryDocumentId: 'abc123',
      locale: 'en',
    })
    const frId = adapter.addCollectionNamePrefixToId({
      contentType: 'api::restaurant.restaurant',
      entryDocumentId: 'abc123',
      locale: 'fr',
    })

    expect(enId).toBe('restaurant-abc123-en')
    expect(frId).toBe('restaurant-abc123-fr')
    expect(new Set([enId, frId]).size).toBe(2)
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

  test('addCollectionNamePrefix maps localized entries to unique locale-aware ids', () => {
    const adapter = createAdapterService({ strapi })
    const entries = [
      { id: 1, documentId: 'abc123', locale: 'en', title: 'Test' },
      { id: 2, documentId: 'abc123', locale: 'fr', title: 'Test 2' },
    ]

    const result = adapter.addCollectionNamePrefix({
      contentType: 'api::restaurant.restaurant',
      entries,
    })

    expect(result).toHaveLength(2)
    const ids = result.map((entry) => entry._meilisearch_id)
    expect(ids).toEqual(['restaurant-abc123-en', 'restaurant-abc123-fr'])
    expect(new Set(ids).size).toBe(2)
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

  test('keeps locale suffix when entries share documentId', () => {
    const adapter = createAdapterService({ strapi })
    const entries = [
      { id: 1, documentId: 'abc123', locale: 'en', title: 'English' },
      { id: 2, documentId: 'abc123', locale: 'fr', title: 'French' },
    ]
    const result = adapter.addCollectionNamePrefix({
      contentType: 'api::restaurant.restaurant',
      entries,
    })

    expect(result).toEqual([
      { ...entries[0], _meilisearch_id: 'restaurant-abc123-en' },
      { ...entries[1], _meilisearch_id: 'restaurant-abc123-fr' },
    ])
    expect(new Set(result.map(entry => entry._meilisearch_id)).size).toBe(2)
  })
})
