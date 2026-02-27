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
      Promise.resolve({ id: 1, documentId: 'doc-1', title: 'Test entry' }),
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
      entriesQuery: { ...entriesQuery.mock.results[0].value },
    })
    expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entries: [expect.objectContaining({ id: 1, title: 'Test entry' })],
    })
  })

  test('processes update action for listened content types after next()', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      entriesQuery,
      contentTypeGetEntry,
    } = createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'update',
      params: { data: { title: 'Updated title' } },
    }

    const result = { id: 10, documentId: 10, title: 'Updated title' }
    await handler(ctx, () => Promise.resolve(result))

    expect(entriesQuery).toHaveBeenCalledWith({ contentType: ctx.uid })
    expect(contentTypeGetEntry).toHaveBeenCalledWith({
      contentType: ctx.uid,
      documentId: result.documentId,
      entriesQuery: { ...entriesQuery.mock.results[0].value },
    })
    expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entries: [expect.objectContaining({ id: 1, title: 'Test entry' })],
    })
  })

  test('processes publish action like update for listened content types', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      entriesQuery,
      contentTypeGetEntry,
    } = createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'publish',
      params: { data: { title: 'Published title' } },
    }

    const result = { id: 11, documentId: 11, title: 'Published title' }
    await handler(ctx, () => Promise.resolve(result))

    expect(entriesQuery).toHaveBeenCalledWith({ contentType: ctx.uid })
    expect(contentTypeGetEntry).toHaveBeenCalledWith({
      contentType: ctx.uid,
      documentId: result.documentId,
      entriesQuery: { ...entriesQuery.mock.results[0].value },
    })
    expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entries: [expect.objectContaining({ id: 1, title: 'Test entry' })],
    })
  })

  test('falls back to delete when updated entry is not returned', async () => {
    const {
      strapi,
      middlewareFn,
      deleteEntriesFromMeiliSearch,
      contentTypeGetEntry,
    } = createStrapiStubs()

    contentTypeGetEntry.mockResolvedValueOnce(null)

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'update',
      params: { data: { title: 'Updated title' } },
    }

    const result = { id: 12, documentId: 'doc-12', title: 'Updated title' }
    await handler(ctx, () => Promise.resolve(result))

    expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entriesId: [result.documentId],
    })
  })

  test('processes delete-like actions by removing from Meilisearch', async () => {
    const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
      createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'delete',
    }

    const result = { id: 13, documentId: 'doc-13' }
    await handler(ctx, () => Promise.resolve(result))

    expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entriesId: [result.documentId],
    })
  })

  test('processes unpublish action by removing from Meilisearch', async () => {
    const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
      createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'unpublish',
    }

    const result = { id: 14, documentId: 'doc-14' }
    await handler(ctx, () => Promise.resolve(result))

    expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entriesId: [result.documentId],
    })
  })

  test('processes discardDraft action by removing from Meilisearch', async () => {
    const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
      createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'discardDraft',
    }

    const result = { id: 15, documentId: 'doc-15' }
    await handler(ctx, () => Promise.resolve(result))

    expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entriesId: [result.documentId],
    })
  })

  test('update action uses id from getEntry, not from action result (D&P fix)', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      contentTypeGetEntry,
    } = createStrapiStubs()

    // getEntry returns the PUBLISHED version with id: 200
    contentTypeGetEntry.mockResolvedValueOnce({
      id: 200,
      documentId: 'abc',
      title: 'Published',
      publishedAt: '2024-01-01',
    })

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'update',
      params: { data: { title: 'Draft update' } },
    }

    // result has the DRAFT id: 100, different from published id: 200
    const result = { id: 100, documentId: 'abc', title: 'Draft update' }
    await handler(ctx, () => Promise.resolve(result))

    expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entries: [expect.objectContaining({ id: 200, documentId: 'abc' })],
    })
  })

  test('update action calls delete when getEntry returns null (no published version)', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      deleteEntriesFromMeiliSearch,
      contentTypeGetEntry,
    } = createStrapiStubs()

    // getEntry returns null (no published version exists)
    contentTypeGetEntry.mockResolvedValueOnce(null)

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'update',
      params: { data: { title: 'Draft only' } },
    }

    const result = { id: 100, documentId: 'abc', title: 'Draft only' }
    await handler(ctx, () => Promise.resolve(result))

    expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
    // Uses documentId (not internal id) for deletion since _meilisearch_id is documentId-based
    expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entriesId: ['abc'],
    })
  })

  test('publish action handles result without id at root level', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      contentTypeGetEntry,
    } = createStrapiStubs()

    // getEntry returns the published version
    contentTypeGetEntry.mockResolvedValueOnce({
      id: 200,
      documentId: 'abc',
      title: 'Published',
      publishedAt: '2024-01-01',
    })

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'publish',
      params: { documentId: 'abc' },
    }

    // publish result may not have id at root (Strapi v5 can return array of versions)
    const result = { documentId: 'abc', versions: [{ id: 200 }] }
    await handler(ctx, () => Promise.resolve(result))

    expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entries: [expect.objectContaining({ id: 200, documentId: 'abc' })],
    })
  })

  test('does nothing when content type is not listened', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      deleteEntriesFromMeiliSearch,
    } = createStrapiStubs({ listened: [] })

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'update',
    }

    const result = { id: 16, documentId: 16 }
    await handler(ctx, () => Promise.resolve(result))

    expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
    expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
  })

  test('does nothing when result is missing', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      deleteEntriesFromMeiliSearch,
    } = createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'update',
    }

    await handler(ctx, () => Promise.resolve(undefined))

    expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
    expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
  })

  test('logs error but does not throw when Meilisearch call fails', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      deleteEntriesFromMeiliSearch,
    } = createStrapiStubs()

    const error = new Error('network down')
    updateEntriesInMeilisearch.mockRejectedValueOnce(error)

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'create',
    }

    const result = { id: 17, documentId: 17 }
    const next = jest
      .fn()
      .mockResolvedValueOnce(result)
      .mockResolvedValue(undefined)

    await expect(handler(ctx, next)).resolves.toBe(result)

    expect(next).toHaveBeenCalledTimes(1)
    expect(updateEntriesInMeilisearch).toHaveBeenCalled()
    expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
    expect(strapi.log.error).toHaveBeenCalled()
  })
})
