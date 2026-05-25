import registerDocumentMiddleware from '../services/document-middleware/index.js'
import { mockLogger } from '../__mocks__/strapi'

describe('Document Service to Meilisearch sync middleware', () => {
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

  test('discardDraft removes indexed records when sync targets published entries', async () => {
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

  describe('locale-aware removals from Meilisearch', () => {
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

    describe('when sync config indexes all locales (locale: *)', () => {
      test('delete with params.locale removes only that locale record', async () => {
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

      test('unpublish with params.locale removes only that locale record', async () => {
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

      test('delete without params.locale removes only the pre-delete entry locale', async () => {
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

      test('unpublish without params.locale removes only the pre-delete entry locale', async () => {
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

      test('delete with params.locale=* removes all locale records for the Strapi document', async () => {
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

      test('unpublish with params.locale=* removes all locale records for the Strapi document', async () => {
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
    })

    describe('when sync config indexes draft entries across locales', () => {
      test('delete with params.locale=* removes all draft locale records', async () => {
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

  describe('draft/publish lifecycle sync behavior', () => {
    test('unpublish is ignored when sync config indexes drafts', async () => {
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

    test('discardDraft is ignored when sync config indexes published entries', async () => {
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

    test('discardDraft re-indexes only params.locale in draft sync', async () => {
      const strapiDraftFrenchEntry = {
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

    test('discardDraft with params.locale=* re-indexes every returned draft locale', async () => {
      const strapiDraftEnglishEntry = {
        id: 203,
        documentId: 'doc-23',
        locale: 'en',
        publishedAt: null,
        title: 'English draft',
      }
      const strapiDraftFrenchEntry = {
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

    test('discardDraft re-fetches params.locale when result misses that Strapi document', async () => {
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

    test('publish does not fan out published locales when sync config indexes drafts', async () => {
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

  describe('locale=* sync re-fetch behavior', () => {
    test('create re-fetches the Strapi entry with params.locale when needed', async () => {
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

    test('update re-fetches the Strapi entry with params.locale when needed', async () => {
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

    test('update uses the params.locale entry from result before re-fetching', async () => {
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

    test('publish re-fetches the Strapi entry with params.locale when needed', async () => {
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

    test('locale=* re-fetch keeps sync query options while narrowing to params.locale', async () => {
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

  describe('publish fan-out across locales', () => {
    test('publish with params.locale=* indexes every returned published locale entry', async () => {
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
