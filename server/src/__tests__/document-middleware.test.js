import registerDocumentMiddleware from '../services/document-middleware/index.js'
import { mockLogger } from '../__mocks__/strapi'

describe('Document Service Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createStrapiStubs = ({
    listened = ['api::restaurant.restaurant'],
    indexed = ['api::restaurant.restaurant'],
  } = {}) => {
    const use = jest.fn()
    let middlewareFn
    use.mockImplementation(fn => {
      middlewareFn = fn
    })

    const entriesQuery = jest.fn(() => ({}))
    const updateEntriesInMeilisearch = jest.fn(() => Promise.resolve())
    const deleteEntriesFromMeiliSearch = jest.fn(() => Promise.resolve())
    const contentTypeGetEntry = jest.fn(() =>
      Promise.resolve({ id: 1, title: 'Test entry' }),
    )

    const service = jest.fn(name => {
      if (name === 'store') {
        return {
          getListenedContentTypes: () => listened,
          getIndexedContentTypes: () => indexed,
        }
      }
      if (name === 'meilisearch') {
        return {
          entriesQuery,
          updateEntriesInMeilisearch,
          deleteEntriesFromMeiliSearch,
        }
      }
      if (name === 'contentType') {
        return {
          getEntry: contentTypeGetEntry,
        }
      }
      throw new Error(`Unexpected service: ${name}`)
    })

    const strapi = {
      log: mockLogger,
      documents: { use },
      plugin: jest.fn(() => ({ service })),
    }

    return {
      strapi,
      use,
      middlewareFn: () => middlewareFn,
      entriesQuery,
      updateEntriesInMeilisearch,
      deleteEntriesFromMeiliSearch,
      contentTypeGetEntry,
    }
  }

  test('registers middleware when strapi.documents.use exists', async () => {
    const { strapi, use } = createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    expect(use).toHaveBeenCalledTimes(1)
    expect(use.mock.calls[0][0]).toBeInstanceOf(Function)
  })

  test('does not throw when strapi.documents is missing', async () => {
    const strapi = {
      log: mockLogger,
      plugin: jest.fn(),
    }

    await expect(registerDocumentMiddleware({ strapi })).resolves.not.toThrow()
  })

  test('processes create action for listened content types after next()', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      entriesQuery,
      contentTypeGetEntry,
    } = createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    expect(handler).toBeDefined()

    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'create',
      params: { data: { title: 'My title' } },
    }

    const result = { id: 10, documentId: 10, title: 'My title' }
    await handler(ctx, () => Promise.resolve(result))

    expect(entriesQuery).toHaveBeenCalledWith({ contentType: ctx.uid })
    expect(contentTypeGetEntry).toHaveBeenCalledWith({
      contentType: ctx.uid,
      documentId: result.documentId,
      entriesQuery: {
        ...entriesQuery.mock.results[0].value,
        locale: result.locale,
        status: 'published',
      },
    })
    expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entries: [expect.objectContaining({ id: result.id })],
    })
  })

  // These actions should all call updateEntriesInMeilisearch with the fetched entry
  // - publish: entry with publishedAt will be indexed
  // - unpublish: entry without publishedAt will be filtered by sanitization and deleted
  // - discardDraft: reindexes current published entry (no-op in Meilisearch)
  test.each(['update', 'publish', 'unpublish', 'discardDraft'])(
    'processes %s action for listened content types after next()',
    async action => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        entriesQuery,
        contentTypeGetEntry,
      } = createStrapiStubs()

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      expect(handler).toBeDefined()

      const ctx = {
        uid: 'api::restaurant.restaurant',
        action,
        params: { data: { title: 'Updated title' } },
      }

      const result = { id: 10, documentId: 10, title: 'Updated title' }
      await handler(ctx, () => Promise.resolve(result))

      expect(entriesQuery).toHaveBeenCalledWith({ contentType: ctx.uid })
      expect(contentTypeGetEntry).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentId: result.documentId,
        entriesQuery: {
          ...entriesQuery.mock.results[0].value,
          locale: result.locale,
          status: 'published',
        },
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [
          expect.objectContaining({
            id: result.id,
            documentId: result.documentId,
          }),
        ],
      })
    },
  )

  test('does not process actions for non-listened content types', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      contentTypeGetEntry,
    } = createStrapiStubs({
      listened: ['api::restaurant.restaurant'],
    })

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()

    const ctx = {
      uid: 'api::category.category', // Not in listened list
      action: 'create',
      params: { data: { name: 'Category' } },
    }

    const result = { id: 5, documentId: 5, name: 'Category' }
    const returnedResult = await handler(ctx, () => Promise.resolve(result))

    // Should not call any Meilisearch methods
    expect(contentTypeGetEntry).not.toHaveBeenCalled()
    expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
    // Should return result unchanged
    expect(returnedResult).toEqual(result)
  })

  test('processes delete action for single entry', async () => {
    const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
      createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    expect(handler).toBeDefined()

    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'delete',
    }

    const result = { id: 10 }
    await handler(ctx, () => Promise.resolve(result))

    expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entriesId: [result.id],
    })
  })

  test('processes delete action for multiple entries (bulk delete)', async () => {
    const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
      createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()

    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'delete',
    }

    const result = [{ id: 10 }, { id: 20 }, { id: 30 }]
    await handler(ctx, () => Promise.resolve(result))

    expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entriesId: [10, 20, 30],
    })
  })

  test('handles delete action with mixed valid and invalid IDs', async () => {
    const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
      createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()

    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'delete',
    }

    // Result with some entries missing id or having null/undefined
    const result = [
      { id: 10 },
      { id: null },
      { id: 20 },
      {},
      { id: undefined },
      { id: 30 },
    ]
    await handler(ctx, () => Promise.resolve(result))

    // Should only include valid IDs
    expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entriesId: [10, 20, 30],
    })
  })
})
