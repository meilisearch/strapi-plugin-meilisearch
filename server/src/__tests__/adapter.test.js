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

  test('addCollectionNamePrefixToId encodes locale when present', () => {
    const adapter = createAdapterService({ strapi })
    const resultWithLocale = adapter.addCollectionNamePrefixToId({
      contentType: 'api::restaurant.restaurant',
      entryDocumentId: 'abc123',
      locale: 'en',
    })
    expect(resultWithLocale).toBe('restaurant-abc123-en')
  })

  test('addCollectionNamePrefixToId falls back to collection-documentId without locale', () => {
    const adapter = createAdapterService({ strapi })
    const result = adapter.addCollectionNamePrefixToId({
      contentType: 'api::restaurant.restaurant',
      entryDocumentId: 'abc123',
      locale: undefined,
    })
    expect(result).toBe('restaurant-abc123')
  })

  test('addCollectionNamePrefixToId uses different locale values', () => {
    const adapter = createAdapterService({ strapi })
    expect(
      adapter.addCollectionNamePrefixToId({
        contentType: 'api::restaurant.restaurant',
        entryDocumentId: 'abc123',
        locale: 'en',
      }),
    ).toBe('restaurant-abc123-en')
    expect(
      adapter.addCollectionNamePrefixToId({
        contentType: 'api::restaurant.restaurant',
        entryDocumentId: 'abc123',
        locale: 'fr',
      }),
    ).toBe('restaurant-abc123-fr')
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

  test('addCollectionNamePrefix maps locale entries with locale-aware IDs', () => {
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
    expect(result[0]._meilisearch_id).toBe('restaurant-abc123-en')
    expect(result[1]._meilisearch_id).toBe('restaurant-abc123-fr')
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

  test('addCollectionNamePrefixToId includes locale when present', () => {
    const adapter = createAdapterService({ strapi })
    const result = adapter.addCollectionNamePrefixToId({
      contentType: 'api::restaurant.restaurant',
      entryDocumentId: 'abc123',
      locale: 'fr',
    })

    expect(result).toBe('restaurant-abc123-fr')
  })

  test('addCollectionNamePrefix keeps locale in ids when documentId is shared across locales', () => {
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
