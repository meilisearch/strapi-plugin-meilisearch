import registerDocumentMiddleware from '../services/document-middleware/index.js'
import { mockLogger } from '../__mocks__/strapi'
import {
  SYNC_PRESETS,
  createDraftEntry,
  createPublishedEntry,
} from './utils/document-middleware-fixtures.js'

describe('Strapi document middleware', () => {
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

  describe('registration behavior', () => {
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

      await expect(
        registerDocumentMiddleware({ strapi }),
      ).resolves.not.toThrow()
    })
  })

  describe('default published-sync removal behavior', () => {
    test('delete removes indexed document for Strapi documentId', async () => {
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

    test('unpublish removes indexed document for Strapi documentId', async () => {
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

    test('discardDraft removes indexed document for Strapi documentId with default published sync config', async () => {
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
  })

  describe('unique refetched-Strapi-document indexing behavior', () => {
    test('update indexes refetched Strapi document even when action-result id is draft', async () => {
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

    test('publish indexes refetched Strapi document even when action-result root has no id', async () => {
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

    test('draft-only sync indexes refetched draft Strapi document from entriesQuery instead of nested versions payload', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        meilisearchEntriesQuery: { status: 'draft' },
        contentTypeGetEntry: jest.fn(() =>
          Promise.resolve({
            id: 101,
            documentId: 'abc',
            title: 'Refetched draft entry',
            publishedAt: null,
          }),
        ),
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

      expect(contentTypeGetEntry).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentId: 'abc',
        entriesQuery: { status: 'draft' },
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [expect.objectContaining({ id: 101, documentId: 'abc' })],
      })
    })

    test('published-only sync indexes refetched published Strapi document from entriesQuery instead of nested versions payload', async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
      } = createStrapiStubs({
        contentTypeGetEntry: jest.fn(() =>
          Promise.resolve({
            id: 201,
            documentId: 'abc',
            title: 'Refetched published entry',
            publishedAt: '2024-02-01',
          }),
        ),
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

      expect(contentTypeGetEntry).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentId: 'abc',
        entriesQuery: {},
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [expect.objectContaining({ id: 201, documentId: 'abc' })],
      })
    })

    test('publish prioritizes ctx.params.documentId when result.documentId differs', async () => {
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
  })

  describe('Meilisearch skip behavior', () => {
    test('skips Meilisearch when content type is not listened', async () => {
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

    test('skips Meilisearch when document action has no result payload', async () => {
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
  })

  describe("removes locales for wildcard locale (locale: '*') sync", () => {
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

    describe('published-only index removal behavior', () => {
      test('delete removes locales for requested locale', async () => {
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

      test('unpublish removes locales for requested locale', async () => {
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

      test('delete without explicit locale uses pre-action locale snapshot', async () => {
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

      test('unpublish without explicit locale uses pre-action locale snapshot', async () => {
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

      test("delete with wildcard locale (locale: '*') action removes all indexed locales", async () => {
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

      test("delete with wildcard locale (locale: '*') action captures pre-action locale snapshot", async () => {
        const preActionLocaleVariants = [
          { documentId: 'doc-16', locale: 'en' },
          { documentId: 'doc-16', locale: 'fr' },
        ]
        const readPhases = []
        const { strapi, middlewareFn, deleteEntriesFromMeiliSearch } =
          createStrapiStubs({
            meilisearchEntriesQuery: { locale: '*' },
            contentTypeGetEntry: jest.fn(() => {
              readPhases.push('pre-action Strapi document snapshot')
              return Promise.resolve({
                id: 16,
                documentId: 'doc-16',
                locale: 'en',
                publishedAt: '2024-01-01',
              })
            }),
            contentTypeGetEntries: jest.fn(({ fields }) => {
              if (Array.isArray(fields)) {
                readPhases.push('pre-action locale snapshot')
                return Promise.resolve(preActionLocaleVariants)
              }

              readPhases.push('post-action locale read')
              return Promise.resolve([])
            }),
          })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'delete',
          params: { documentId: 'doc-16', locale: '*' },
        }
        const actionResult = { id: 16, documentId: 'doc-16' }
        const next = jest.fn(() => {
          expect(readPhases).toEqual([
            'pre-action Strapi document snapshot',
            'pre-action locale snapshot',
          ])
          return Promise.resolve(actionResult)
        })

        await handler(ctx, next)

        expect(next).toHaveBeenCalledTimes(1)
        expect(readPhases).toEqual([
          'pre-action Strapi document snapshot',
          'pre-action locale snapshot',
        ])
        expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentIds: [actionResult.documentId],
          entriesQuery: { locale: '*' },
          locales: ['en', 'fr'],
        })
      })

      test("unpublish with wildcard locale (locale: '*') action removes all indexed locales", async () => {
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

      test("publish fallback removal defers wildcard locale (locale: '*') refetch and skips Meilisearch removal when no concrete locale is available", async () => {
        const {
          strapi,
          middlewareFn,
          deleteEntriesFromMeiliSearch,
          contentTypeGetEntry,
          contentTypeGetEntries,
        } = createStrapiStubs({
          meilisearchEntriesQuery: { locale: '*' },
          contentTypeGetEntries: jest.fn(() => Promise.resolve([])),
        })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'publish',
          params: { documentId: 'doc-1' },
        }
        const result = { documentId: 'doc-1' }

        await handler(ctx, () => Promise.resolve(result))

        expect(contentTypeGetEntries).toHaveBeenCalledWith({
          contentType: ctx.uid,
          locale: '*',
          filters: {
            documentId: 'doc-1',
          },
        })
        expect(contentTypeGetEntry).not.toHaveBeenCalled()
        expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
      })

      test("create fallback removal defers wildcard locale (locale: '*') refetch and skips Meilisearch removal when no concrete locale is available", async () => {
        const {
          strapi,
          middlewareFn,
          deleteEntriesFromMeiliSearch,
          contentTypeGetEntry,
          contentTypeGetEntries,
        } = createStrapiStubs({
          meilisearchEntriesQuery: { locale: '*' },
          contentTypeGetEntries: jest.fn(() => Promise.resolve([])),
        })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action: 'create',
          params: { documentId: 'doc-1' },
        }
        const result = { documentId: 'doc-1' }

        await handler(ctx, () => Promise.resolve(result))

        expect(contentTypeGetEntries).toHaveBeenCalledWith({
          contentType: ctx.uid,
          locale: '*',
          filters: {
            documentId: 'doc-1',
          },
        })
        expect(contentTypeGetEntry).not.toHaveBeenCalled()
        expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
      })
    })

    describe('draft-only index removal behavior', () => {
      test("delete with wildcard locale (locale: '*') action removes all draft locales", async () => {
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

  describe('draft/publish scoped index behavior', () => {
    afterEach(() => {
      jest.useRealTimers()
    })

    test('unpublish skips Meilisearch when index stores drafts', async () => {
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

    test('discardDraft skips Meilisearch when index stores published entries', async () => {
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

    test("discardDraft with wildcard locale (locale: '*') action re-indexes all returned draft locales", async () => {
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

    test('discardDraft uses pre-action locale snapshot to remove stale draft locales from index', async () => {
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

    test("discardDraft with wildcard locale (locale: '*') keeps draft locales in sync after next immediate turn", async () => {
      jest.useFakeTimers({ legacyFakeTimers: true })

      const strapiDraftEnglishEntry = createDraftEntry({
        id: 803,
        documentId: 'doc-80',
        locale: 'en',
      })
      const readPhases = []
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        deleteEntriesFromMeiliSearch,
        contentTypeGetEntries,
      } = createStrapiStubs({
        meilisearchEntriesQuery: SYNC_PRESETS.draftAllLocales,
        contentTypeGetEntry: jest.fn(() => {
          readPhases.push('pre-action Strapi document snapshot')
          return Promise.resolve(
            createDraftEntry({
              id: 801,
              documentId: 'doc-80',
              locale: 'en',
            }),
          )
        }),
        contentTypeGetEntries: jest.fn(({ fields }) => {
          if (Array.isArray(fields)) {
            readPhases.push('pre-action locale snapshot')
            return Promise.resolve([
              { documentId: 'doc-80', locale: 'en' },
              { documentId: 'doc-80', locale: 'fr' },
            ])
          }

          readPhases.push('post-action draft refetch')
          return Promise.resolve([
            createDraftEntry({
              id: 803,
              documentId: 'doc-80',
              locale: 'en',
            }),
            createPublishedEntry({
              id: 804,
              documentId: 'doc-80',
              locale: 'fr',
            }),
          ])
        }),
      })

      await registerDocumentMiddleware({ strapi })

      const handler = middlewareFn()
      const ctx = {
        uid: 'api::restaurant.restaurant',
        action: 'discardDraft',
        params: { documentId: 'doc-80', locale: '*' },
      }
      const actionResult = {
        documentId: 'doc-80',
        versions: [
          strapiDraftEnglishEntry,
          createPublishedEntry({
            id: 802,
            documentId: 'doc-80',
            locale: 'fr',
          }),
        ],
      }
      let resolveNextInvocation = () => {}
      const nextInvokedPromise = new Promise(resolve => {
        resolveNextInvocation = resolve
      })
      const next = jest.fn(() => {
        expect(readPhases).toEqual([
          'pre-action Strapi document snapshot',
          'pre-action locale snapshot',
        ])
        resolveNextInvocation()
        return Promise.resolve(actionResult)
      })

      const middlewareRunPromise = handler(ctx, next)

      await nextInvokedPromise
      await Promise.resolve()

      expect(next).toHaveBeenCalledTimes(1)
      expect(readPhases).toEqual([
        'pre-action Strapi document snapshot',
        'pre-action locale snapshot',
      ])
      expect(contentTypeGetEntries).toHaveBeenCalledTimes(1)

      jest.runAllImmediates()

      await middlewareRunPromise

      expect(contentTypeGetEntries).toHaveBeenNthCalledWith(1, {
        contentType: ctx.uid,
        fields: ['documentId', 'locale'],
        locale: '*',
        status: 'draft',
        filters: {
          documentId: 'doc-80',
        },
      })
      expect(contentTypeGetEntries).toHaveBeenNthCalledWith(2, {
        contentType: ctx.uid,
        locale: '*',
        status: 'draft',
        filters: {
          documentId: 'doc-80',
        },
      })
      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [
          expect.objectContaining({
            documentId: 'doc-80',
            locale: 'en',
          }),
        ],
      })
      expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        documentIds: ['doc-80'],
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

    test("publish uses deferred wildcard locale (locale: '*') draft refetch and does not fan out published locales when index stores drafts", async () => {
      const {
        strapi,
        middlewareFn,
        updateEntriesInMeilisearch,
        contentTypeGetEntry,
        contentTypeGetEntries,
      } = createStrapiStubs({
        meilisearchEntriesQuery: SYNC_PRESETS.draftAllLocales,
        contentTypeGetEntries: jest.fn(() =>
          Promise.resolve([
            {
              id: 206,
              documentId: 'doc-25',
              locale: 'en',
              publishedAt: null,
              title: 'English draft fallback',
            },
          ]),
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

      expect(contentTypeGetEntries).toHaveBeenCalledWith({
        contentType: ctx.uid,
        status: 'draft',
        locale: '*',
        filters: {
          documentId: 'doc-25',
        },
      })
      expect(contentTypeGetEntry).not.toHaveBeenCalled()
      expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
        contentType: ctx.uid,
        entries: [
          expect.objectContaining({ id: 206, locale: 'en', publishedAt: null }),
        ],
      })
    })
  })

  describe('refetch-first Strapi document indexing behavior', () => {
    test.each([
      {
        action: 'create',
        params: {},
      },
      {
        action: 'update',
        params: { documentId: 'doc-30' },
      },
      {
        action: 'publish',
        params: { documentId: 'doc-30' },
      },
    ])(
      '$action indexes refetched Strapi document from entriesQuery before indexing action-result payload even when payload looks indexable',
      async ({ action, params }) => {
        const {
          strapi,
          middlewareFn,
          updateEntriesInMeilisearch,
          contentTypeGetEntry,
          contentTypeGetEntries,
        } = createStrapiStubs({
          contentTypeGetEntry: jest.fn(() =>
            Promise.resolve({
              id: 301,
              documentId: 'doc-30',
              locale: 'fr',
              title: 'Refetched entry',
              publishedAt: '2024-01-02',
            }),
          ),
        })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action,
          params,
        }
        const result = {
          id: 901,
          documentId: 'doc-30',
          locale: 'fr',
          title: 'Action result entry',
          publishedAt: '2024-01-01',
        }

        await handler(ctx, () => Promise.resolve(result))

        expect(contentTypeGetEntry).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentId: 'doc-30',
          entriesQuery: {},
        })
        expect(contentTypeGetEntries).not.toHaveBeenCalled()
        expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          entries: [
            expect.objectContaining({
              id: 301,
              documentId: 'doc-30',
              locale: 'fr',
              title: 'Refetched entry',
            }),
          ],
        })
      },
    )

    test.each([
      {
        caseName: 'default published sync',
        action: 'update',
        params: { documentId: 'doc-31' },
        meilisearchEntriesQuery: {},
        expectedEntriesQuery: {},
      },
      {
        caseName: 'locale-scoped sync',
        action: 'update',
        params: { documentId: 'doc-31' },
        meilisearchEntriesQuery: SYNC_PRESETS.frenchOnly,
        expectedEntriesQuery: SYNC_PRESETS.frenchOnly,
      },
    ])(
      '$action skips Meilisearch when refetch returns null for $caseName and never indexes action-result payload',
      async ({
        action,
        params,
        meilisearchEntriesQuery,
        expectedEntriesQuery,
      }) => {
        const {
          strapi,
          middlewareFn,
          updateEntriesInMeilisearch,
          deleteEntriesFromMeiliSearch,
          contentTypeGetEntry,
        } = createStrapiStubs({
          meilisearchEntriesQuery,
          contentTypeGetEntry: jest.fn(() => Promise.resolve(null)),
        })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action,
          params,
        }
        const result = {
          id: 910,
          documentId: 'doc-31',
          locale: 'fr',
          title: 'Action result entry',
          publishedAt: '2024-01-01',
        }

        await handler(ctx, () => Promise.resolve(result))

        expect(contentTypeGetEntry).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentId: 'doc-31',
          entriesQuery: expectedEntriesQuery,
        })
        expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
        expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
      },
    )

    test.each([
      {
        action: 'create',
        params: { locale: 'fr' },
      },
      {
        action: 'publish',
        params: { documentId: 'doc-50', locale: 'fr' },
      },
    ])(
      '$action removes locales when locale refetch is null and skips Meilisearch action-result Strapi document indexing',
      async ({ action, params }) => {
        const {
          strapi,
          middlewareFn,
          updateEntriesInMeilisearch,
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
          action,
          params,
        }
        const result = {
          id: 920,
          documentId: 'doc-50',
          locale: 'fr',
          title: 'Action result entry',
          publishedAt: '2024-01-01',
          versions: [
            {
              id: 921,
              documentId: 'doc-50',
              locale: 'fr',
              publishedAt: '2024-01-01',
            },
          ],
        }

        await handler(ctx, () => Promise.resolve(result))

        expect(contentTypeGetEntry).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentId: 'doc-50',
          entriesQuery: { locale: 'fr' },
        })
        expect(updateEntriesInMeilisearch).not.toHaveBeenCalled()
        expect(deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          documentIds: ['doc-50'],
          entriesQuery: { locale: '*' },
          locales: ['fr'],
        })
      },
    )
  })

  describe("wildcard locale (locale: '*') deferred refetch timing", () => {
    beforeEach(() => {
      jest.useFakeTimers({ legacyFakeTimers: true })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test.each([
      {
        action: 'create',
        params: { locale: '*' },
      },
      {
        action: 'update',
        params: { documentId: 'doc-40', locale: '*' },
      },
      {
        action: 'publish',
        params: { documentId: 'doc-40', locale: '*' },
      },
    ])(
      "$action indexes all locales only after next immediate turn when sync and action locales are wildcard locale (locale: '*')",
      async ({ action, params }) => {
        const refetchedEntries = [
          {
            id: 401,
            documentId: 'doc-40',
            locale: 'en',
            publishedAt: '2024-01-01',
            title: 'English published',
          },
          {
            id: 402,
            documentId: 'doc-40',
            locale: 'fr',
            publishedAt: '2024-01-01',
            title: 'French published',
          },
        ]
        const {
          strapi,
          middlewareFn,
          updateEntriesInMeilisearch,
          deleteEntriesFromMeiliSearch,
          contentTypeGetEntry,
          contentTypeGetEntries,
        } = createStrapiStubs({
          meilisearchEntriesQuery: { locale: '*' },
          contentTypeGetEntries: jest.fn(() =>
            Promise.resolve(refetchedEntries),
          ),
        })

        await registerDocumentMiddleware({ strapi })

        const handler = middlewareFn()
        const ctx = {
          uid: 'api::restaurant.restaurant',
          action,
          params,
        }
        const result = {
          id: 930,
          documentId: 'doc-40',
          locale: '*',
          versions: [
            {
              id: 931,
              documentId: 'doc-40',
              locale: 'en',
              publishedAt: '2024-01-01',
            },
            {
              id: 932,
              documentId: 'doc-40',
              locale: 'fr',
              publishedAt: '2024-01-01',
            },
          ],
        }

        let resolveNextInvocation = () => {}
        const nextInvokedPromise = new Promise(resolve => {
          resolveNextInvocation = resolve
        })
        const next = jest.fn(() => {
          resolveNextInvocation()
          return Promise.resolve(result)
        })
        const middlewareRunPromise = handler(ctx, next)

        await nextInvokedPromise
        for (let microtaskCount = 0; microtaskCount < 10; microtaskCount += 1) {
          await Promise.resolve()
        }

        expect(next).toHaveBeenCalledTimes(1)
        expect(contentTypeGetEntries).not.toHaveBeenCalled()
        expect(contentTypeGetEntry).not.toHaveBeenCalled()

        jest.runAllImmediates()

        await middlewareRunPromise

        expect(contentTypeGetEntries).toHaveBeenCalledWith(
          expect.objectContaining({
            contentType: ctx.uid,
            locale: '*',
            filters: {
              documentId: 'doc-40',
            },
          }),
        )
        expect(contentTypeGetEntry).not.toHaveBeenCalled()
        expect(deleteEntriesFromMeiliSearch).not.toHaveBeenCalled()
        expect(updateEntriesInMeilisearch).toHaveBeenCalledWith({
          contentType: ctx.uid,
          entries: [
            expect.objectContaining({
              id: 401,
              documentId: 'doc-40',
              locale: 'en',
            }),
            expect.objectContaining({
              id: 402,
              documentId: 'doc-40',
              locale: 'fr',
            }),
          ],
        })
      },
    )
  })

  describe('bulk locale removal behavior', () => {
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

    test("deleteMany with wildcard locale (locale: '*') action removes locale variants per deleted document", async () => {
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
