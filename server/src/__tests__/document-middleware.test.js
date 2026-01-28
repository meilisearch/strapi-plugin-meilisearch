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
      entriesQuery: { ...entriesQuery.mock.results[0].value },
    })
    expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entries: [expect.objectContaining({ id: result.id })],
    })
  })
})
