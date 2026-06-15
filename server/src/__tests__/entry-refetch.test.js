import {
  fetchSingleEntryAfterTransaction,
  fetchWildcardLocaleEntriesForIndexing,
} from '../services/document-middleware/entry-refetch.js'

describe('entry refetch scheduling for indexing behavior', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  test('single-locale refetch reads only after the next immediate turn', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true })

    const refetchedEntry = {
      id: 301,
      documentId: 'doc-301',
      locale: 'fr',
      publishedAt: '2024-01-01',
    }
    const getEntry = jest.fn(() => Promise.resolve(refetchedEntry))
    const contentTypeService = {
      getEntry,
    }

    const refetchPromise = fetchSingleEntryAfterTransaction({
      contentTypeService,
      contentType: 'api::restaurant.restaurant',
      documentId: 'doc-301',
      indexingQuery: { locale: 'fr' },
    })

    expect(getEntry).not.toHaveBeenCalled()

    jest.runAllImmediates()

    await expect(refetchPromise).resolves.toEqual(refetchedEntry)
    expect(getEntry).toHaveBeenCalledWith({
      contentType: 'api::restaurant.restaurant',
      documentId: 'doc-301',
      entriesQuery: { locale: 'fr' },
    })
  })

  test('wildcard-locale refetch reads only after the next immediate turn', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true })

    const refetchedEntries = [
      {
        id: 401,
        documentId: 'doc-401',
        locale: 'en',
        publishedAt: '2024-01-01',
      },
      {
        id: 402,
        documentId: 'doc-401',
        locale: 'fr',
        publishedAt: '2024-01-01',
      },
    ]
    const getEntries = jest.fn(() => Promise.resolve(refetchedEntries))
    const contentTypeService = {
      getEntries,
    }

    const refetchPromise = fetchWildcardLocaleEntriesForIndexing({
      contentTypeService,
      contentType: 'api::restaurant.restaurant',
      documentId: 'doc-401',
      indexingQuery: { locale: '*', status: 'published' },
    })

    expect(getEntries).not.toHaveBeenCalled()

    jest.runAllImmediates()

    await expect(refetchPromise).resolves.toEqual(refetchedEntries)
    expect(getEntries).toHaveBeenCalledWith({
      contentType: 'api::restaurant.restaurant',
      locale: '*',
      status: 'published',
      filters: {
        documentId: 'doc-401',
      },
    })
  })

  test('wildcard-locale refetch uses multi-entry reads instead of single-entry locale=*', async () => {
    const getEntries = jest.fn(() => Promise.resolve([]))
    const getEntry = jest.fn(() => Promise.resolve(null))
    const contentTypeService = {
      getEntries,
      getEntry,
    }

    await fetchWildcardLocaleEntriesForIndexing({
      contentTypeService,
      contentType: 'api::restaurant.restaurant',
      documentId: 'doc-402',
      indexingQuery: { locale: '*', status: 'published' },
    })

    expect(getEntries).toHaveBeenCalledWith({
      contentType: 'api::restaurant.restaurant',
      locale: '*',
      status: 'published',
      filters: {
        documentId: 'doc-402',
      },
    })
    expect(getEntry).not.toHaveBeenCalled()
  })
})
