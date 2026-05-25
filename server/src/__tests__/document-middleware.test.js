import registerDocumentMiddleware from '../services/document-middleware/index.js'
import { mockLogger } from '../__mocks__/strapi'

describe('Document Service Middleware', () => {
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

  test('skips deletion when updated entry is not returned', async () => {
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

  test('does not delete after update when no published entry is returned', async () => {
    const {
      strapi,
      middlewareFn,
      updateEntriesInMeilisearch,
      deleteEntriesFromMeiliSearch,
      contentTypeGetEntry,
    } = createStrapiStubs({
      meilisearchEntriesQuery: { locale: 'fr' },
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

  test('propagates wildcard entriesQuery when deleting a document', async () => {
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
      documentIds: [result.documentId],
      entriesQuery: {},
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
      documentIds: [result.documentId],
      entriesQuery: {},
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
      documentIds: [result.documentId],
      entriesQuery: {},
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

  test('update action does not delete when getEntry returns null (no published version)', async () => {
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

  test('draft update prefers nested draft entry over wrapper root', async () => {
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
          title: 'Draft row',
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

  test('published update prefers nested published entry over wrapper root', async () => {
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
          title: 'Published row',
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

  test('prefers ctx.params.documentId over result documentId for publish actions', async () => {
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

    const result = { id: 16, documentId: 'doc-16' }
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

  describe('locale-scoped delete actions', () => {
    const publishedLocaleEntries = [
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

    describe('when the index contains all locales', () => {
      test('delete removes only the requested locale', async () => {
        const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
          createStrapiStubs({
            meilisearchEntriesQuery: { locale: '*' },
            contentTypeGetEntries: jest.fn(() =>
              Promise.resolve(publishedLocaleEntries),
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
              Promise.resolve(publishedLocaleEntries),
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

      test('delete without locale removes only the default locale', async () => {
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
              Promise.resolve(publishedLocaleEntries),
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

      test('unpublish without locale removes only the default locale', async () => {
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
              Promise.resolve(publishedLocaleEntries),
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

      test('delete with wildcard action locale removes all locales', async () => {
        const localizedVariants = [
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
            Promise.resolve(localizedVariants),
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

      test('unpublish with wildcard action locale removes all locales', async () => {
        const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
          createStrapiStubs({
            meilisearchEntriesQuery: { locale: '*' },
            contentTypeGetEntries: jest.fn(() =>
              Promise.resolve(publishedLocaleEntries),
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
    })

    describe('when the index contains draft entries for all locales', () => {
      test('delete with wildcard action locale resolves draft locale variants', async () => {
        const localizedVariants = [
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
            Promise.resolve(localizedVariants),
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

  describe('draft-and-publish document actions', () => {
    test('unpublish does not affect draft indexes', async () => {
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

    test('discardDraft does not affect published indexes', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { status: 'published' },
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

    test('discardDraft updates only the requested draft locale', async () => {
      const draftFrenchEntry = {
        id: 202,
        documentId: 'doc-22',
        locale: 'fr',
        publishedAt: null,
        title: 'French draft',
      }

      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { status: 'draft', locale: 'fr' },
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
        versions: [draftFrenchEntry],
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

    test('discardDraft with wildcard action locale updates all returned draft locales', async () => {
      const draftEnglishEntry = {
        id: 203,
        documentId: 'doc-23',
        locale: 'en',
        publishedAt: null,
        title: 'English draft',
      }
      const draftFrenchEntry = {
        id: 204,
        documentId: 'doc-23',
        locale: 'fr',
        publishedAt: null,
        title: 'French draft',
      }

      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { status: 'draft', locale: '*' },
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
        versions: [draftEnglishEntry, draftFrenchEntry],
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

    test('discardDraft fallback overrides wildcard index locale with action locale', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { status: 'draft', locale: '*' },
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

    test('draft index publish with wildcard locale does not fan out published variants', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { status: 'draft', locale: '*' },
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

  describe('wildcard locale fallback reads', () => {
    test('create fallback uses action locale from params and documentId from result', async () => {
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

    test('update fallback uses action locale', async () => {
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

    test('update prefers locale-matching result candidate for locale-scoped action', async () => {
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

    test('publish fallback uses action locale', async () => {
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

    test('fallback preserves entriesQuery options while overriding wildcard locale', async () => {
      const configuredEntriesQuery = {
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
        meilisearchEntriesQuery: configuredEntriesQuery,
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
          ...configuredEntriesQuery,
          locale: 'fr',
        },
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalled()
    })
  })

  describe('multi-locale publish results', () => {
    test('publish with wildcard action locale indexes every returned version', async () => {
      const publishedEnglishEntry = {
        id: 401,
        documentId: 'doc-40',
        locale: 'en',
        publishedAt: '2024-01-01',
        title: 'English published',
      }
      const publishedFrenchEntry = {
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
        versions: [publishedEnglishEntry, publishedFrenchEntry],
      }

      await handler(ctx, () => Promise.resolve(result))

      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [publishedEnglishEntry, publishedFrenchEntry],
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
