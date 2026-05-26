import registerDocumentMiddleware from '../services/document-middleware/index.js'
import { mockLogger } from '../__mocks__/strapi'
import {
  SYNC_PRESETS,
  createDraftEntry,
  createPublishedEntry,
} from './utils/document-middleware-fixtures.js'

describe('Meilisearch sync on Strapi document changes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createStrapiStubs = ({
    listened = ['api::restaurant.restaurant'],
    indexed = ['api::restaurant.restaurant'],
    meilisearchEntriesQuery = {},
    contentTypeGetEntry = jest.fn(() =>
      Promise.resolve({
        id: 1,
        documentId: 'doc-1',
        title: 'Test entry',
      }),
    ),
    contentTypeGetEntries = jest.fn(() => Promise.resolve([])),
  } = {}) => {
    const use = jest.fn()
    let middlewareFn
    use.mockImplementation(fn => {
      middlewareFn = fn
    })

    const entriesQuery = jest.fn(() => meilisearchEntriesQuery)
    const updateEntriesInMeilisearch = jest.fn(() => Promise.resolve())
    const deleteEntriesFromMeiliSearch = jest.fn(() => Promise.resolve())
    const contentTypeGetEntryMock = contentTypeGetEntry
    const contentTypeGetEntriesMock = contentTypeGetEntries

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
          getEntry: contentTypeGetEntryMock,
          getEntries: contentTypeGetEntriesMock,
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
      contentTypeGetEntry: contentTypeGetEntryMock,
      contentTypeGetEntries: contentTypeGetEntriesMock,
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

  test('indexes the created Strapi document after create completes', async () => {
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

    const result = { id: 10, documentId: 'doc-10', title: 'My title' }
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

  test('re-indexes the Strapi document after update completes', async () => {
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

    const result = { id: 10, documentId: 'doc-10', title: 'Updated title' }
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

  test('indexes the published Strapi entry after publish completes', async () => {
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

    const result = { id: 11, documentId: 'doc-11', title: 'Published title' }
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

  test('keeps index unchanged when update yields no indexable Strapi entry', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
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

    expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
    expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
  })

  test('keeps published-only sync unchanged when update has no published Strapi entry', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      deleteEntriesFromMeiliSearch,
      contentTypeGetEntry,
    } = createStrapiStubs({
      meilisearchEntriesQuery: SYNC_PRESETS.frenchOnly,
    })

    contentTypeGetEntry.mockResolvedValueOnce(null)

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'update',
    }

    const result = { id: 100, documentId: 'abc', title: 'Draft only' }
    await handler(ctx, () => Promise.resolve(result))

    expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
    expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
  })

  test('delete forwards locale=* sync config to Meilisearch removal', async () => {
    const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
      createStrapiStubs({
        meilisearchEntriesQuery: { locale: '*' },
      })

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'delete',
    }

    const result = { id: 15, documentId: 'doc-15' }
    await handler(ctx, () => Promise.resolve(result))

    expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      documentIds: [result.documentId],
      entriesQuery: { locale: '*' },
    })
  })

  test('delete removes indexed records for the Strapi document', async () => {
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
      documentIds: [result.documentId],
      entriesQuery: {},
    })
  })

  test('unpublish removes indexed records for the Strapi document', async () => {
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
      documentIds: [result.documentId],
      entriesQuery: {},
    })
  })

  test('discardDraft removes indexed records with default sync config (no explicit status)', async () => {
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
      documentIds: [result.documentId],
      entriesQuery: {},
    })
  })

  test('update indexes the published Strapi entry even when action result id is draft', async () => {
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

  test('update with no published Strapi entry leaves the index unchanged', async () => {
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
    expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
  })

  test('publish indexes the Strapi entry even when the root result has no id', async () => {
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

  test('draft-only sync indexes the draft entry from nested versions data', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      contentTypeGetEntry,
    } = createStrapiStubs({
      meilisearchEntriesQuery: { status: 'draft' },
    })

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'update',
      params: { documentId: 'abc' },
    }

    const result = {
      documentId: 'abc',
      versions: [
        {
          id: 100,
          documentId: 'abc',
          title: 'Draft entry',
          publishedAt: null,
        },
      ],
    }

    await handler(ctx, () => Promise.resolve(result))

    expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entries: [expect.objectContaining({ id: 100, documentId: 'abc' })],
    })
    expect(contentTypeGetEntry).not.toHaveBeenCalled()
  })

  test('published sync indexes the published entry from nested versions data', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      contentTypeGetEntry,
    } = createStrapiStubs()

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'update',
      params: { documentId: 'abc' },
    }

    const result = {
      documentId: 'abc',
      publishedAt: '2024-02-01',
      versions: [
        {
          id: 200,
          documentId: 'abc',
          title: 'Published entry',
          publishedAt: '2024-02-01',
        },
      ],
    }

    await handler(ctx, () => Promise.resolve(result))

    expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entries: [expect.objectContaining({ id: 200, documentId: 'abc' })],
    })
    expect(contentTypeGetEntry).not.toHaveBeenCalled()
  })

  test('publish uses ctx.params.documentId when result.documentId differs', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      contentTypeGetEntry,
    } = createStrapiStubs()

    contentTypeGetEntry.mockResolvedValueOnce({
      id: 300,
      documentId: 'doc-from-params',
      title: 'Published from params',
      publishedAt: '2024-01-01',
    })

    await registerDocumentMiddleware({ strapi })

    const handler = middlewareFn()
    const ctx = {
      uid: 'api::restaurant.restaurant',
      action: 'publish',
      params: { documentId: 'doc-from-params' },
    }

    const result = {
      documentId: 300,
      id: 300,
      title: 'Published from result',
      publishedAt: '2024-01-01',
    }
    await handler(ctx, () => Promise.resolve(result))

    expect(contentTypeGetEntry).toHaveBeenCalledWith({
      contentType: ctx.uid,
      documentId: 'doc-from-params',
      entriesQuery: {},
    })
    expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: ctx.uid,
      entries: [
        expect.objectContaining({
          documentId: 'doc-from-params',
        }),
      ],
    })
  })

  test('skips sync for content types that are not listened', async () => {
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

    const result = { id: 16, documentId: 'doc-16' }
    await handler(ctx, () => Promise.resolve(result))

    expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
    expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
  })

  test('skips sync when the document action has no result payload', async () => {
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

  describe('all-locale index removal behavior', () => {
    const strapiPublishedLocaleEntries = [
      {
        id: 101,
        documentId: 'doc-1',
        locale: 'en',
        publishedAt: '2024-01-01',
      },
      {
        id: 102,
        documentId: 'doc-1',
        locale: 'fr',
        publishedAt: '2024-01-01',
      },
    ]

    describe('all-locale index (locale: *)', () => {
      test('delete removes only the requested locale', async () => {
        const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
          createStrapiStubs({
            meilisearchEntriesQuery: { locale: '*' },
            contentTypeGetEntries: jest.fn(() =>
              Promise.resolve(strapiPublishedLocaleEntries),
            ),
          })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'delete',
          params: { documentId: 'doc-1', locale: 'fr' },
        }
        const result = { documentId: 'doc-1' }

        await handler(ctx, () => Promise.resolve(result))

        expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentIds: ['doc-1'],
          entriesQuery: { locale: '*' },
          locales: ['fr'],
        })
      })

      test('unpublish removes only the requested locale', async () => {
        const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
          createStrapiStubs({
            meilisearchEntriesQuery: { locale: '*' },
            contentTypeGetEntries: jest.fn(() =>
              Promise.resolve(strapiPublishedLocaleEntries),
            ),
          })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'unpublish',
          params: { documentId: 'doc-1', locale: 'fr' },
        }
        const result = { documentId: 'doc-1' }

        await handler(ctx, () => Promise.resolve(result))

        expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentIds: ['doc-1'],
          entriesQuery: { locale: '*' },
          locales: ['fr'],
        })
      })

      test('delete without an explicit locale removes the pre-delete locale', async () => {
        const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
          createStrapiStubs({
            meilisearchEntriesQuery: { locale: '*' },
            contentTypeGetEntry: jest.fn(() =>
              Promise.resolve({
                id: 101,
                documentId: 'doc-1',
                locale: 'en',
                publishedAt: '2024-01-01',
              }),
            ),
            contentTypeGetEntries: jest.fn(() =>
              Promise.resolve(strapiPublishedLocaleEntries),
            ),
          })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'delete',
          params: { documentId: 'doc-1' },
        }
        const result = { documentId: 'doc-1' }

        await handler(ctx, () => Promise.resolve(result))

        expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentIds: ['doc-1'],
          entriesQuery: { locale: '*' },
          locales: ['en'],
        })
      })

      test('unpublish without an explicit locale removes the pre-delete locale', async () => {
        const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
          createStrapiStubs({
            meilisearchEntriesQuery: { locale: '*' },
            contentTypeGetEntry: jest.fn(() =>
              Promise.resolve({
                id: 101,
                documentId: 'doc-1',
                locale: 'en',
                publishedAt: '2024-01-01',
              }),
            ),
            contentTypeGetEntries: jest.fn(() =>
              Promise.resolve(strapiPublishedLocaleEntries),
            ),
          })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'unpublish',
          params: { documentId: 'doc-1' },
        }
        const result = { documentId: 'doc-1' }

        await handler(ctx, () => Promise.resolve(result))

        expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentIds: ['doc-1'],
          entriesQuery: { locale: '*' },
          locales: ['en'],
        })
      })

      test('delete with all-locale action removes every indexed locale', async () => {
        const strapiLocaleVariants = [
          { documentId: 'doc-15', locale: 'en' },
          { documentId: 'doc-15', locale: 'fr' },
        ]

        const {
          strapi,
          middlewareFn,
          deleteEntriesFromMeiliSearch,
          contentTypeGetEntries,
        } = createStrapiStubs({
          meilisearchEntriesQuery: { locale: '*' },
          contentTypeGetEntries: jest.fn(() =>
            Promise.resolve(strapiLocaleVariants),
          ),
        })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'delete',
          params: { documentId: 'doc-15', locale: '*' },
        }
        const result = { id: 15, documentId: 'doc-15' }
        await handler(ctx, () => Promise.resolve(result))

        expect(contentTypeGetEntries).toHaveBeenCalledWith({
          contentType: ctx.uid,
          fields: ['documentId', 'locale'],
          locale: '*',
          filters: {
            documentId: ctx.params.documentId,
          },
        })
        expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentIds: [result.documentId],
          entriesQuery: { locale: '*' },
          locales: ['en', 'fr'],
        })
      })

      test('unpublish with all-locale action removes every indexed locale', async () => {
        const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
          createStrapiStubs({
            meilisearchEntriesQuery: { locale: '*' },
            contentTypeGetEntries: jest.fn(() =>
              Promise.resolve(strapiPublishedLocaleEntries),
            ),
          })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'unpublish',
          params: { documentId: 'doc-1', locale: '*' },
        }
        const result = { documentId: 'doc-1' }

        await handler(ctx, () => Promise.resolve(result))

        expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentIds: ['doc-1'],
          entriesQuery: { locale: '*' },
          locales: ['en', 'fr'],
        })
      })

      test('publish fallback delete removes only the requested locale', async () => {
        const {
          strapi,
          middlewareFn,
          deleteEntriesFromMeiliSearch,
          contentTypeGetEntry,
        } = createStrapiStubs({
          meilisearchEntriesQuery: { locale: '*' },
          contentTypeGetEntry: jest.fn(() => Promise.resolve(null)),
        })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'publish',
          params: { documentId: 'doc-1', locale: 'fr' },
        }
        const result = {
          documentId: 'doc-1',
          versions: [
            {
              id: 101,
              documentId: 'doc-1',
              locale: 'fr',
              publishedAt: null,
            },
          ],
        }

        await handler(ctx, () => Promise.resolve(result))

        expect(contentTypeGetEntry).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentId: 'doc-1',
          entriesQuery: { locale: 'fr' },
        })
        expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentIds: ['doc-1'],
          entriesQuery: { locale: '*' },
          locales: ['fr'],
        })
      })

      test('create fallback delete removes only the requested locale', async () => {
        const {
          strapi,
          middlewareFn,
          deleteEntriesFromMeiliSearch,
          contentTypeGetEntry,
        } = createStrapiStubs({
          meilisearchEntriesQuery: { locale: '*' },
          contentTypeGetEntry: jest.fn(() => Promise.resolve(null)),
        })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'create',
          params: { locale: 'fr' },
        }
        const result = { documentId: 'doc-1' }

        await handler(ctx, () => Promise.resolve(result))

        expect(contentTypeGetEntry).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentId: 'doc-1',
          entriesQuery: { locale: 'fr' },
        })
        expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentIds: ['doc-1'],
          entriesQuery: { locale: '*' },
          locales: ['fr'],
        })
      })
    })

    describe('draft-only all-locale index', () => {
      test('delete with all-locale action removes every draft locale', async () => {
        const strapiLocaleVariants = [
          { documentId: 'doc-15', locale: 'en' },
          { documentId: 'doc-15', locale: 'fr' },
        ]

        const {
          strapi,
          middlewareFn,
          deleteEntriesFromMeiliSearch,
          contentTypeGetEntries,
        } = createStrapiStubs({
          meilisearchEntriesQuery: { locale: '*', status: 'draft' },
          contentTypeGetEntries: jest.fn(() =>
            Promise.resolve(strapiLocaleVariants),
          ),
        })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'delete',
          params: { documentId: 'doc-15', locale: '*' },
        }
        const result = { id: 15, documentId: 'doc-15' }
        await handler(ctx, () => Promise.resolve(result))

        expect(contentTypeGetEntries).toHaveBeenCalledWith({
          contentType: ctx.uid,
          fields: ['documentId', 'locale'],
          locale: '*',
          status: 'draft',
          filters: {
            documentId: ctx.params.documentId,
          },
        })
        expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentIds: [result.documentId],
          entriesQuery: { locale: '*', status: 'draft' },
          locales: ['en', 'fr'],
        })
      })
    })
  })

  describe('draft-only and published-only index behavior', () => {
    test('unpublish does not change Meilisearch when index stores drafts', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { status: 'draft' },
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'unpublish',
        params: { documentId: 'doc-20', locale: 'fr' },
      }
      const result = { documentId: 'doc-20', locale: 'fr' }

      await handler(ctx, () => Promise.resolve(result))

      expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
      expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
    })

    test('discardDraft does not change Meilisearch when index stores published entries', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
      } = createStrapiStubs({
        meilisearchEntriesQuery: SYNC_PRESETS.publishedOnly,
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'discardDraft',
        params: { documentId: 'doc-21', locale: 'fr' },
      }
      const result = { documentId: 'doc-21', locale: 'fr' }

      await handler(ctx, () => Promise.resolve(result))

      expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
      expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
    })

    test('discardDraft re-indexes only the requested locale for draft indexes', async () => {
      const strapiDraftFrenchEntry = createDraftEntry({
        id: 202,
        documentId: 'doc-22',
        locale: 'fr',
        title: 'French draft',
      })

      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
      } = createStrapiStubs({
        meilisearchEntriesQuery: SYNC_PRESETS.draftFrench,
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'discardDraft',
        params: { documentId: 'doc-22', locale: 'fr' },
      }
      const result = {
        documentId: 'doc-22',
        versions: [strapiDraftFrenchEntry],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [
          expect.objectContaining({ documentId: 'doc-22', locale: 'fr' }),
        ],
      })
    })

    test('discardDraft with all-locale action re-indexes every returned draft locale', async () => {
      const strapiDraftEnglishEntry = createDraftEntry({
        id: 203,
        documentId: 'doc-23',
        locale: 'en',
        title: 'English draft',
      })
      const strapiDraftFrenchEntry = createDraftEntry({
        id: 204,
        documentId: 'doc-23',
        locale: 'fr',
        title: 'French draft',
      })

      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
      } = createStrapiStubs({
        meilisearchEntriesQuery: SYNC_PRESETS.draftAllLocales,
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'discardDraft',
        params: { documentId: 'doc-23', locale: '*' },
      }
      const result = {
        documentId: 'doc-23',
        versions: [strapiDraftEnglishEntry, strapiDraftFrenchEntry],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [
          expect.objectContaining({ documentId: 'doc-23', locale: 'en' }),
          expect.objectContaining({ documentId: 'doc-23', locale: 'fr' }),
        ],
      })
    })

    test('discardDraft with all-locales action removes stale draft locales from the index', async () => {
      const strapiDraftEnglishEntry = createDraftEntry({
        id: 203,
        documentId: 'doc-70',
        locale: 'en',
        title: 'English draft',
      })
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
        contentTypeGetEntries,
      } = createStrapiStubs({
        meilisearchEntriesQuery: SYNC_PRESETS.draftAllLocales,
        contentTypeGetEntries: jest.fn(({ filters, fields }) => {
          if (filters?.documentId === 'doc-70') {
            if (Array.isArray(fields)) {
              return Promise.resolve([
                { documentId: 'doc-70', locale: 'en' },
                { documentId: 'doc-70', locale: 'fr' },
              ])
            }

            return Promise.resolve([
              createDraftEntry({
                id: 703,
                documentId: 'doc-70',
                locale: 'en',
              }),
              createPublishedEntry({
                id: 704,
                documentId: 'doc-70',
                locale: 'fr',
              }),
            ])
          }

          return Promise.resolve([])
        }),
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'discardDraft',
        params: { documentId: 'doc-70', locale: '*' },
      }
      const result = {
        documentId: 'doc-70',
        versions: [
          strapiDraftEnglishEntry,
          {
            id: 204,
            documentId: 'doc-70',
            locale: 'fr',
            publishedAt: '2024-01-01',
          },
        ],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(contentTypeGetEntries).toHaveBeenCalledWith({
        contentType: ctx.uid,
        fields: ['documentId', 'locale'],
        locale: '*',
        status: 'draft',
        filters: {
          documentId: 'doc-70',
        },
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [
          expect.objectContaining({ documentId: 'doc-70', locale: 'en' }),
        ],
      })
      expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentIds: ['doc-70'],
        entriesQuery: { status: 'draft', locale: '*' },
        locales: ['fr'],
      })
    })

    test('discardDraft removes a locale-scoped draft record when the draft no longer exists', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: SYNC_PRESETS.draftFrench,
        contentTypeGetEntry: jest.fn(() => Promise.resolve(null)),
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'discardDraft',
        params: { documentId: 'doc-71', locale: 'fr' },
      }
      const result = {
        documentId: 'doc-71',
        versions: [
          createPublishedEntry({
            id: 711,
            documentId: 'doc-71',
            locale: 'fr',
          }),
        ],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(contentTypeGetEntry).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentId: 'doc-71',
        entriesQuery: { status: 'draft', locale: 'fr' },
      })
      expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
      expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentIds: ['doc-71'],
        entriesQuery: { status: 'draft', locale: 'fr' },
        locales: undefined,
      })
    })

    test('discardDraft loads the requested locale when action result omits the document', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: SYNC_PRESETS.draftAllLocales,
        contentTypeGetEntry: jest.fn(() =>
          Promise.resolve({
            id: 205,
            documentId: 'doc-24',
            locale: 'fr',
            publishedAt: null,
            title: 'French draft fallback',
          }),
        ),
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'discardDraft',
        params: { documentId: 'doc-24', locale: 'fr' },
      }
      const result = {
        documentId: 'doc-24',
        versions: [{ id: 999, documentId: 'other-doc', locale: 'fr' }],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(contentTypeGetEntry).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentId: 'doc-24',
        entriesQuery: { status: 'draft', locale: 'fr' },
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [
          expect.objectContaining({ documentId: 'doc-24', locale: 'fr' }),
        ],
      })
    })

    test('publish does not fan out published locales when index stores drafts', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: SYNC_PRESETS.draftAllLocales,
        contentTypeGetEntry: jest.fn(() =>
          Promise.resolve({
            id: 206,
            documentId: 'doc-25',
            locale: 'en',
            publishedAt: null,
            title: 'English draft fallback',
          }),
        ),
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'publish',
        params: { documentId: 'doc-25', locale: '*' },
      }
      const result = {
        documentId: 'doc-25',
        versions: [
          {
            id: 501,
            documentId: 'doc-25',
            locale: 'en',
            publishedAt: '2024-01-01',
          },
          {
            id: 502,
            documentId: 'doc-25',
            locale: 'fr',
            publishedAt: '2024-01-01',
          },
        ],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(contentTypeGetEntry).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentId: 'doc-25',
        entriesQuery: { status: 'draft', locale: '*' },
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [
          expect.objectContaining({ id: 206, locale: 'en', publishedAt: null }),
        ],
      })
    })
  })

  describe('locale-specific fallback reads for all-locale indexes', () => {
    test('create loads the requested locale from Strapi when needed', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { locale: '*' },
        contentTypeGetEntry: jest.fn(() =>
          Promise.resolve({
            id: 301,
            documentId: 'doc-30',
            locale: 'fr',
            publishedAt: '2024-01-01',
          }),
        ),
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'create',
        params: { locale: 'fr' },
      }
      const result = { documentId: 'doc-30' }

      await handler(ctx, () => Promise.resolve(result))

      expect(contentTypeGetEntry).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentId: 'doc-30',
        entriesQuery: { locale: 'fr' },
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalled()
    })

    test('update loads the requested locale from Strapi when needed', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { locale: '*' },
        contentTypeGetEntry: jest.fn(() =>
          Promise.resolve({
            id: 301,
            documentId: 'doc-30',
            locale: 'fr',
            publishedAt: '2024-01-01',
          }),
        ),
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'update',
        params: { documentId: 'doc-30', locale: 'fr' },
      }
      const result = {
        documentId: 'doc-30',
        versions: [
          { id: 999, documentId: 'other-doc', publishedAt: '2024-01-01' },
        ],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(contentTypeGetEntry).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentId: 'doc-30',
        entriesQuery: { locale: 'fr' },
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalled()
    })

    test('update prefers the requested locale from result before reading Strapi', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { locale: '*' },
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'update',
        params: { documentId: 'doc-32', locale: 'fr' },
      }
      const result = {
        documentId: 'doc-32',
        versions: [
          {
            id: 601,
            documentId: 'doc-32',
            locale: 'en',
            publishedAt: '2024-01-01',
          },
          {
            id: 602,
            documentId: 'doc-32',
            locale: 'fr',
            publishedAt: '2024-01-01',
          },
        ],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(contentTypeGetEntry).not.toHaveBeenCalled()
      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [expect.objectContaining({ id: 602, locale: 'fr' })],
      })
    })

    test('publish loads the requested locale from Strapi when needed', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { locale: '*' },
        contentTypeGetEntry: jest.fn(() =>
          Promise.resolve({
            id: 301,
            documentId: 'doc-30',
            locale: 'fr',
            publishedAt: '2024-01-01',
          }),
        ),
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'publish',
        params: { documentId: 'doc-30', locale: 'fr' },
      }
      const result = {
        documentId: 'doc-30',
        versions: [
          { id: 999, documentId: 'other-doc', publishedAt: '2024-01-01' },
        ],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(contentTypeGetEntry).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentId: 'doc-30',
        entriesQuery: { locale: 'fr' },
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalled()
    })

    test('locale-scoped fallback read preserves configured sync query options', async () => {
      const configuredSyncQuery = {
        locale: '*',
        status: 'published',
        fields: ['title', 'locale'],
        populate: { image: true },
        filters: { featured: true },
      }
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: configuredSyncQuery,
        contentTypeGetEntry: jest.fn(() =>
          Promise.resolve({
            id: 302,
            documentId: 'doc-31',
            locale: 'fr',
            publishedAt: '2024-01-01',
          }),
        ),
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'publish',
        params: { documentId: 'doc-31', locale: 'fr' },
      }
      const result = {
        documentId: 'doc-31',
        versions: [
          { id: 999, documentId: 'other-doc', publishedAt: '2024-01-01' },
        ],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(contentTypeGetEntry).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentId: 'doc-31',
        entriesQuery: {
          ...configuredSyncQuery,
          locale: 'fr',
        },
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalled()
    })
  })

  describe('publish behavior for all-locale actions', () => {
    test('publish with all-locale action indexes every returned published locale', async () => {
      const strapiPublishedEnglishEntry = {
        id: 401,
        documentId: 'doc-40',
        locale: 'en',
        publishedAt: '2024-01-01',
        title: 'English published',
      }
      const strapiPublishedFrenchEntry = {
        id: 402,
        documentId: 'doc-40',
        locale: 'fr',
        publishedAt: '2024-01-01',
        title: 'French published',
      }

      const { strapi, middlewareFn, updateEntriesInMeilisearch } =
        createStrapiStubs({
          meilisearchEntriesQuery: { locale: '*' },
        })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'publish',
        params: { documentId: 'doc-40', locale: '*' },
      }
      const result = {
        documentId: 'doc-40',
        versions: [strapiPublishedEnglishEntry, strapiPublishedFrenchEntry],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [strapiPublishedEnglishEntry, strapiPublishedFrenchEntry],
      })
    })

    test('publish with all-locale action and concrete sync locale indexes only owned locale', async () => {
      const strapiPublishedEnglishEntry = {
        id: 411,
        documentId: 'doc-41',
        locale: 'en',
        publishedAt: '2024-01-01',
      }
      const strapiPublishedFrenchEntry = {
        id: 412,
        documentId: 'doc-41',
        locale: 'fr',
        publishedAt: '2024-01-01',
      }

      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
      } = createStrapiStubs({
        meilisearchEntriesQuery: SYNC_PRESETS.frenchOnly,
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'publish',
        params: { documentId: 'doc-41', locale: '*' },
      }
      const result = {
        documentId: 'doc-41',
        versions: [strapiPublishedEnglishEntry, strapiPublishedFrenchEntry],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [strapiPublishedFrenchEntry],
      })
      expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
    })

    test('publish with all-locale action removes stale owned locale when result omits it', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: SYNC_PRESETS.frenchOnly,
        contentTypeGetEntry: jest.fn(() => Promise.resolve(null)),
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'publish',
        params: { documentId: 'doc-42', locale: '*' },
      }
      const result = {
        documentId: 'doc-42',
        versions: [
          {
            id: 421,
            documentId: 'doc-42',
            locale: 'en',
            publishedAt: '2024-01-01',
          },
        ],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(contentTypeGetEntry).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentId: 'doc-42',
        entriesQuery: { locale: 'fr' },
      })
      expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
      expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentIds: ['doc-42'],
        entriesQuery: { locale: 'fr' },
        locales: undefined,
      })
    })
  })

  describe('bulk removal actions', () => {
    test('deleteMany removes all deleted documents from Meilisearch', async () => {
      const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
        createStrapiStubs()

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'deleteMany',
        params: { documentIds: ['doc-a', 'doc-b'] },
      }
      const result = [{ documentId: 'doc-a' }, { documentId: 'doc-b' }]

      await handler(ctx, () => Promise.resolve(result))

      expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentIds: ['doc-a', 'doc-b'],
        entriesQuery: {},
      })
    })

    test('deleteMany with all-locales action removes locale variants per deleted document', async () => {
      const {
        strapi,
        middlewareFn,
        deleteEntriesFromMeiliSearch,
        contentTypeGetEntries,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { locale: '*' },
        contentTypeGetEntries: jest.fn(({ filters }) => {
          if (filters?.documentId === 'doc-a') {
            return Promise.resolve([
              { documentId: 'doc-a', locale: 'en' },
              { documentId: 'doc-a', locale: 'fr' },
            ])
          }
          if (filters?.documentId === 'doc-b') {
            return Promise.resolve([{ documentId: 'doc-b', locale: 'en' }])
          }

          return Promise.resolve([])
        }),
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'deleteMany',
        params: { documentIds: ['doc-a', 'doc-b'], locale: '*' },
      }
      const result = [{ documentId: 'doc-a' }, { documentId: 'doc-b' }]

      await handler(ctx, () => Promise.resolve(result))

      expect(contentTypeGetEntries).toHaveBeenCalledWith({
        contentType: ctx.uid,
        fields: ['documentId', 'locale'],
        locale: '*',
        filters: {
          documentId: 'doc-a',
        },
      })
      expect(contentTypeGetEntries).toHaveBeenCalledWith({
        contentType: ctx.uid,
        fields: ['documentId', 'locale'],
        locale: '*',
        filters: {
          documentId: 'doc-b',
        },
      })
      expect(deleteEntriesFromMeiliSearch).toHaveBeenNthCalledWith(1, {
        contentType: ctx.uid,
        documentIds: ['doc-a'],
        entriesQuery: { locale: '*' },
        locales: ['en', 'fr'],
      })
      expect(deleteEntriesFromMeiliSearch).toHaveBeenNthCalledWith(2, {
        contentType: ctx.uid,
        documentIds: ['doc-b'],
        entriesQuery: { locale: '*' },
        locales: ['en'],
      })
    })
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

    const result = { id: 17, documentId: 'doc-17' }
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
