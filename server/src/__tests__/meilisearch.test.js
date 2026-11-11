import createMeilisearchService from '../services/meilisearch'
import { MeiliSearch as Meilisearch } from 'meilisearch'
import { createLocaleMeilisearchContext } from './utils/meilisearch-locale-helpers.js'

import { createStrapiMock, mockLogger } from '../__mocks__/strapi'
import failedSyncQueue from '../services/store/failed-sync-queue'

jest.mock('meilisearch')

const strapiMock = createStrapiMock({})

// @ts-ignore
global.strapi = strapiMock

describe('Meilisearch service behavior', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test get all contentTypes types', async () => {
    const customStrapi = createStrapiMock({})

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const indexes = await meilisearchService.getIndexUids()

    expect(indexes).toEqual(['my_restaurant', 'restaurant'])
  })

  test('Test to add entries in Meilisearch', async () => {
    const pluginMock = jest.fn(() => ({
      // This rewrites only the needed methods to reach the system under test (removeSensitiveFields)
      service: jest.fn().mockImplementation(() => {
        return {
          async actionInBatches({ contentType = 'restaurant', callback }) {
            await callback({
              entries: [
                {
                  id: 1,
                  documentId: 'doc1',
                  title: 'title',
                  internal_notes: 'note123',
                  secret: '123',
                },
                {
                  id: 2,
                  documentId: 'doc2',
                  title: 'abc',
                  internal_notes: 'note234',
                  secret: '234',
                },
              ],
              contentType,
            })
          },
          getCollectionName: ({ contentType }) => contentType,
          addIndexedContentType: jest.fn(),
          clearFailedSyncs: jest.fn(),
          getFailedSyncQueue: jest.fn(async () => []),
          removeFailedSyncs: jest.fn(async () => 0),
          subscribeContentType: jest.fn(),
          getCredentials: () => ({}),
        }
      }),
    }))

    // Spy
    const client = new Meilisearch({ host: 'abc' })

    const meilisearchService = createMeilisearchService({
      strapi: {
        plugin: pluginMock,
        contentTypes: {
          restaurant: {
            attributes: {
              id: { private: false },
              title: { private: false },
              internal_notes: { private: true },
              secret: { private: true },
            },
          },
        },
        config: {
          get: jest.fn(() => ({
            restaurant: {
              noSanitizePrivateFields: ['internal_notes'],
              indexName: 'customIndex',
            },
          })),
        },
        log: mockLogger,
      },
      contentTypes: {
        restaurant: {
          attributes: {
            id: { private: false },
            title: { private: false },
            internal_notes: { private: true },
            secret: { private: true },
          },
        },
      },
    })

    // In Strapi v5 - If Draft & Publish is disabled, publishedAt is set to the latest creation or edition date of the document
    // More information: https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/publishedat-always-set-when-dandp-disabled
    const mockEntry = {
      attributes: { id: 1 },
      documentId: 'doc-1',
      publishedAt: '2022-01-01T00:00:00.000Z',
    }
    const tasks = await meilisearchService.addEntriesToMeilisearch({
      contentType: 'restaurant',
      entries: [mockEntry, mockEntry],
    })

    expect(strapi.log.info).toHaveBeenCalledTimes(1)
    expect(strapi.log.info).toHaveBeenCalledWith(
      'The task to add 2 documents to the Meilisearch index "customIndex" has been enqueued (Task uid: undefined).',
    )
    expect(client.index('').addDocuments).toHaveBeenCalledTimes(1)
    expect(client.index).toHaveBeenCalledWith('customIndex')
    expect(tasks).toEqual([10])
  })

  test('indexes locale variants individually when documentId is shared', async () => {
    const client = new Meilisearch({ host: 'abc' })
    const { meilisearchService } = createLocaleMeilisearchContext({
      entriesQuery: { locale: '*' },
      indexNames: ['customIndex'],
    })

    const enEntry = {
      attributes: { id: 1 },
      documentId: 'doc-1',
      locale: 'en',
      title: 'English title',
      publishedAt: '2022-01-01T00:00:00.000Z',
    }
    const frEntry = {
      attributes: { id: 2 },
      documentId: 'doc-1',
      locale: 'fr',
      title: 'Titre français',
      publishedAt: '2022-01-01T00:00:00.000Z',
    }

    await meilisearchService.addEntriesToMeilisearch({
      contentType: 'restaurant',
      entries: [enEntry, frEntry],
    })

    expect(client.index('').addDocuments).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          _meilisearch_id: 'restaurant-doc-1-en',
          locale: 'en',
        }),
        expect.objectContaining({
          _meilisearch_id: 'restaurant-doc-1-fr',
          locale: 'fr',
        }),
      ]),
      { primaryKey: '_meilisearch_id' },
    )
  })

  test('Test to add entries linked to multiple indexes in Meilisearch', async () => {
    const pluginMock = jest.fn(() => ({
      // This rewrites only the needed methods to reach the system under test (removeSensitiveFields)
      service: jest.fn().mockImplementation(() => {
        return {
          async actionInBatches({ contentType = 'restaurant', callback }) {
            await callback({
              entries: [
                {
                  id: 1,
                  documentId: 'doc1',
                  title: 'title',
                  internal_notes: 'note123',
                  secret: '123',
                },
                {
                  id: 2,
                  documentId: 'doc2',
                  title: 'abc',
                  internal_notes: 'note234',
                  secret: '234',
                },
              ],
              contentType,
            })
          },
          getCollectionName: ({ contentType }) => contentType,
          addIndexedContentType: jest.fn(),
          clearFailedSyncs: jest.fn(),
          getFailedSyncQueue: jest.fn(async () => []),
          removeFailedSyncs: jest.fn(async () => 0),
          subscribeContentType: jest.fn(),
          getCredentials: () => ({}),
        }
      }),
    }))

    // Spy
    const client = new Meilisearch({ host: 'abc' })

    const meilisearchService = createMeilisearchService({
      strapi: {
        plugin: pluginMock,
        contentTypes: {
          restaurant: {
            attributes: {
              id: { private: false },
              title: { private: false },
              internal_notes: { private: true },
              secret: { private: true },
            },
          },
        },
        config: {
          get: jest.fn(() => ({
            restaurant: {
              noSanitizePrivateFields: ['internal_notes'],
              indexName: ['customIndex', 'anotherIndex'],
            },
          })),
        },
        log: mockLogger,
      },
      contentTypes: {
        restaurant: {
          attributes: {
            id: { private: false },
            title: { private: false },
            internal_notes: { private: true },
            secret: { private: true },
          },
        },
      },
    })

    // In Strapi v5 - If Draft & Publish is disabled, publishedAt is set to the latest creation or edition date of the document
    // More information: https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/publishedat-always-set-when-dandp-disabled
    const mockEntry = {
      attributes: { id: 1 },
      documentId: 'doc-1',
      publishedAt: '2022-01-01T00:00:00.000Z',
    }
    const tasks = await meilisearchService.addEntriesToMeilisearch({
      contentType: 'restaurant',
      entries: [mockEntry, mockEntry],
    })

    expect(strapi.log.info).toHaveBeenCalledTimes(2)
    expect(strapi.log.info).toHaveBeenCalledWith(
      'The task to add 2 documents to the Meilisearch index "customIndex" has been enqueued (Task uid: undefined).',
    )
    expect(strapi.log.info).toHaveBeenCalledWith(
      'The task to add 2 documents to the Meilisearch index "anotherIndex" has been enqueued (Task uid: undefined).',
    )
    expect(client.index('').addDocuments).toHaveBeenCalledTimes(2)
    expect(client.index).toHaveBeenCalledWith('customIndex')
    expect(client.index).toHaveBeenCalledWith('anotherIndex')
    expect(tasks).toEqual([10, 10])
  })

  test('Test to delete entries from Meilisearch', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: ['customIndex'],
      },
    })

    // Spy
    const client = new Meilisearch({ host: 'abc' })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const tasks = await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      documentIds: ['doc-1', 'doc-2'],
    })

    expect(customStrapi.log.info).toHaveBeenCalledTimes(1)
    expect(customStrapi.log.info).toHaveBeenCalledWith(
      'A task to delete 2 documents of the index "customIndex" in Meilisearch has been enqueued (Task uid: undefined).',
    )
    expect(client.index('').deleteDocuments).toHaveBeenCalledTimes(1)
    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-doc-1',
      'restaurant-doc-2',
    ])
    expect(client.index).toHaveBeenCalledWith('customIndex')
    expect(tasks).toEqual([{ taskUid: 1 }, { taskUid: 2 }])
  })

  test('Test to delete entries linked to multiple indexes from Meilisearch', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: ['customIndex', 'anotherIndex'],
      },
    })

    // Spy
    const client = new Meilisearch({ host: 'abc' })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const tasks = await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      documentIds: ['doc-1', 'doc-2'],
    })

    expect(customStrapi.log.info).toHaveBeenCalledTimes(2)
    expect(customStrapi.log.info).toHaveBeenCalledWith(
      'A task to delete 2 documents of the index "customIndex" in Meilisearch has been enqueued (Task uid: undefined).',
    )
    expect(customStrapi.log.info).toHaveBeenCalledWith(
      'A task to delete 2 documents of the index "anotherIndex" in Meilisearch has been enqueued (Task uid: undefined).',
    )
    expect(client.index('').deleteDocuments).toHaveBeenCalledTimes(2)
    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-doc-1',
      'restaurant-doc-2',
    ])
    expect(client.index).toHaveBeenCalledWith('customIndex')
    expect(client.index).toHaveBeenCalledWith('anotherIndex')
    expect(tasks).toEqual([
      { taskUid: 1 },
      { taskUid: 2 },
      { taskUid: 1 },
      { taskUid: 2 },
    ])
  })

  test('deletes only the configured locale variant', async () => {
    const client = new Meilisearch({ host: 'abc' })
    const { meilisearchService } = createLocaleMeilisearchContext({
      entriesQuery: { locale: 'fr' },
      indexNames: ['customIndex'],
    })

    await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      documentIds: ['doc-1'],
    })

    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-doc-1-fr',
    ])
  })

  test('deletes every locale variant for all-locale indexes', async () => {
    const getEntriesMock = jest.fn(() => [
      { documentId: 'doc-1', locale: 'en' },
      { documentId: 'doc-1', locale: 'fr' },
    ])

    const client = new Meilisearch({ host: 'abc' })
    const { meilisearchService } = createLocaleMeilisearchContext({
      entriesQuery: { locale: '*' },
      indexNames: ['customIndex'],
      getEntriesMock,
    })

    await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      documentIds: ['doc-1'],
    })

    expect(getEntriesMock).toHaveBeenCalledWith({
      contentType: 'restaurant',
      fields: ['documentId', 'locale'],
      locale: '*',
      filters: {
        documentId: 'doc-1',
      },
    })
    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-doc-1-en',
      'restaurant-doc-1-fr',
    ])
  })

  test('deduplicates wildcard locale lookups for duplicate documentIds', async () => {
    const getEntriesMock = jest.fn(() => [
      { documentId: 'doc-1', locale: 'en' },
      { documentId: 'doc-1', locale: 'fr' },
    ])

    const client = new Meilisearch({ host: 'abc' })
    const { meilisearchService } = createLocaleMeilisearchContext({
      entriesQuery: { locale: '*' },
      indexNames: ['customIndex'],
      getEntriesMock,
    })

    await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      documentIds: ['doc-1', 'doc-1'],
    })

    expect(getEntriesMock).toHaveBeenCalledTimes(1)
    expect(getEntriesMock).toHaveBeenCalledWith({
      contentType: 'restaurant',
      fields: ['documentId', 'locale'],
      locale: '*',
      filters: {
        documentId: 'doc-1',
      },
    })
    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-doc-1-en',
      'restaurant-doc-1-fr',
    ])
  })

  test('deletes base document when no localized entries exist', async () => {
    const getEntriesMock = jest.fn(async () => [])

    const client = new Meilisearch({ host: 'abc' })
    const { meilisearchService } = createLocaleMeilisearchContext({
      entriesQuery: { locale: '*' },
      indexNames: ['customIndex'],
      getEntriesMock,
    })

    await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      documentIds: ['doc-1'],
    })

    expect(getEntriesMock).toHaveBeenCalledWith({
      contentType: 'restaurant',
      fields: ['documentId', 'locale'],
      locale: '*',
      filters: {
        documentId: 'doc-1',
      },
    })
    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-doc-1',
    ])
  })

  test('treats entriesQuery locale=all as all-locale deletion', async () => {
    const entriesFetcher = jest.fn(() => [
      { documentId: 'doc-1', locale: 'en' },
      { documentId: 'doc-1', locale: 'fr' },
    ])

    const client = new Meilisearch({ host: 'abc' })
    const { meilisearchService, getEntriesMock } =
      createLocaleMeilisearchContext({
        entriesQuery: { locale: 'all' },
        indexNames: ['customIndex'],
        getEntriesMock: entriesFetcher,
      })

    await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      documentIds: ['doc-1'],
    })

    expect(getEntriesMock).toHaveBeenCalledWith({
      contentType: 'restaurant',
      fields: ['documentId', 'locale'],
      locale: '*',
      filters: {
        documentId: 'doc-1',
      },
    })
    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-doc-1-en',
      'restaurant-doc-1-fr',
    ])
  })

  test('all-locale lookups keep the configured status filter', async () => {
    const getEntriesMock = jest.fn(() => [
      { documentId: 'doc-1', locale: 'en' },
      { documentId: 'doc-1', locale: 'fr' },
    ])

    const client = new Meilisearch({ host: 'abc' })
    const { meilisearchService } = createLocaleMeilisearchContext({
      entriesQuery: { locale: '*', status: 'draft' },
      indexNames: ['customIndex'],
      getEntriesMock,
    })

    await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      documentIds: ['doc-1'],
    })

    expect(getEntriesMock).toHaveBeenCalledWith({
      contentType: 'restaurant',
      fields: ['documentId', 'locale'],
      locale: '*',
      status: 'draft',
      filters: {
        documentId: 'doc-1',
      },
    })
    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-doc-1-en',
      'restaurant-doc-1-fr',
    ])
  })

  test('uses provided locales instead of querying Strapi locales', async () => {
    const getEntriesMock = jest.fn(() => {
      throw new Error(
        'getEntries should not be called when locales are provided',
      )
    })

    const pluginMock = jest.fn(() => ({
      service: jest.fn(name => {
        if (name === 'contentType') {
          return {
            getCollectionName: () => 'restaurant',
            getEntries: getEntriesMock,
          }
        }
        if (name === 'store') {
          return {
            getCredentials: () => ({
              host: 'http://localhost:7700',
              apiKey: 'masterKey',
            }),
          }
        }
        if (name === 'meilisearch') {
          return {}
        }
        return {
          getCollectionName: () => 'restaurant',
          getCredentials: () => ({}),
          actionInBatches: jest.fn(),
          addIndexedContentType: jest.fn(),
          clearFailedSyncs: jest.fn(),
          getFailedSyncQueue: jest.fn(async () => []),
          removeFailedSyncs: jest.fn(async () => 0),
          subscribeContentType: jest.fn(),
        }
      }),
    }))

    const client = new Meilisearch({ host: 'abc' })
    const meilisearchService = createMeilisearchService({
      strapi: {
        plugin: pluginMock,
        config: {
          get: jest.fn(() => ({
            restaurant: {
              indexName: ['customIndex'],
              entriesQuery: {
                locale: '*',
              },
            },
          })),
        },
        contentTypes: {
          restaurant: {
            attributes: {
              id: { private: false },
              documentId: { private: false },
              locale: { private: false },
              title: { private: false },
              publishedAt: { private: false },
            },
          },
        },
        log: mockLogger,
      },
      contentTypes: {
        restaurant: {
          attributes: {
            id: { private: false },
            documentId: { private: false },
            locale: { private: false },
            title: { private: false },
            publishedAt: { private: false },
          },
        },
      },
    })

    await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      documentIds: ['doc-1'],
      locales: ['en', 'fr'],
    })

    expect(getEntriesMock).not.toHaveBeenCalled()
    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-doc-1-en',
      'restaurant-doc-1-fr',
    ])
  })

  test('Test deleteEntriesFromMeiliSearch filters out null and undefined documentIds', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: ['customIndex'],
      },
    })

    const client = new Meilisearch({ host: 'abc' })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      documentIds: ['doc-1', null, undefined, 'doc-2'],
    })

    expect(client.index('').deleteDocuments).toHaveBeenCalledTimes(1)
    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-doc-1',
      'restaurant-doc-2',
    ])
    expect(customStrapi.log.info).toHaveBeenCalledWith(
      'A task to delete 2 documents of the index "customIndex" in Meilisearch has been enqueued (Task uid: undefined).',
    )
  })

  test('Test deleteEntriesFromMeiliSearch returns early when all documentIds are null', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: ['customIndex'],
      },
    })

    const client = new Meilisearch({ host: 'abc' })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const result = await meilisearchService.deleteEntriesFromMeiliSearch({
      contentType: 'restaurant',
      documentIds: [null, undefined],
    })

    expect(result).toEqual([])
    expect(client.index('').deleteDocuments).not.toHaveBeenCalled()
    expect(customStrapi.log.info).not.toHaveBeenCalled()
  })

  test('Test to update entries linked to multiple indexes in Meilisearch', async () => {
    const pluginMock = jest.fn(() => ({
      // This rewrites only the needed methods to reach the system under test (removeSensitiveFields)
      service: jest.fn().mockImplementation(() => {
        return {
          async actionInBatches({ contentType = 'restaurant', callback }) {
            await callback({
              entries: [
                {
                  id: 1,
                  documentId: 'doc1',
                  title: 'title',
                  internal_notes: 'note123',
                  secret: '123',
                },
                {
                  id: 2,
                  documentId: 'doc2',
                  title: 'abc',
                  internal_notes: 'note234',
                  secret: '234',
                },
              ],
              contentType,
            })
          },
          getCollectionName: ({ contentType }) => contentType,
          addIndexedContentType: jest.fn(),
          clearFailedSyncs: jest.fn(),
          getFailedSyncQueue: jest.fn(async () => []),
          removeFailedSyncs: jest.fn(async () => 0),
          subscribeContentType: jest.fn(),
          getCredentials: () => ({}),
        }
      }),
    }))

    // Spy
    const client = new Meilisearch({ host: 'abc' })

    const meilisearchService = createMeilisearchService({
      strapi: {
        plugin: pluginMock,
        contentTypes: {
          restaurant: {
            attributes: {
              id: { private: false },
              title: { private: false },
              internal_notes: { private: true },
              secret: { private: true },
            },
          },
        },
        config: {
          get: jest.fn(() => ({
            restaurant: {
              noSanitizePrivateFields: ['internal_notes'],
              indexName: ['customIndex', 'anotherIndex'],
            },
          })),
        },
        log: mockLogger,
      },
      contentTypes: {
        restaurant: {
          attributes: {
            id: { private: false },
            title: { private: false },
            internal_notes: { private: true },
            secret: { private: true },
          },
        },
      },
    })

    // In Strapi v5 - If Draft & Publish is disabled, publishedAt is set to the latest creation or edition date of the document
    // More information: https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/publishedat-always-set-when-dandp-disabled
    const mockEntryUpdate = {
      attributes: { id: 1 },
      documentId: 'doc-update',
      publishedAt: '2022-01-01T00:00:00.000Z',
    }

    const mockEntryCreate = {
      _meilisearch_id: 'restaurant-doc-create',
      id: 3,
      documentId: 'doc-create',
      title: 'title',
      internal_notes: 'note123',
      publishedAt: null,
    }

    const tasks = await meilisearchService.updateEntriesInMeilisearch({
      contentType: 'restaurant',
      entries: [mockEntryUpdate, mockEntryCreate],
    })

    expect(strapi.log.info).toHaveBeenCalledTimes(4)
    expect(strapi.log.info).toHaveBeenCalledWith(
      'A task to update 1 documents to the Meilisearch index "customIndex" has been enqueued.',
    )
    expect(strapi.log.info).toHaveBeenCalledWith(
      'A task to update 1 documents to the Meilisearch index "anotherIndex" has been enqueued.',
    )
    expect(client.index('').updateDocuments).toHaveBeenCalledTimes(2)
    expect(client.index('').deleteDocument).toHaveBeenCalledTimes(2)

    expect(client.index).toHaveBeenCalledWith('customIndex')
    expect(client.index).toHaveBeenCalledWith('anotherIndex')
    expect(tasks).toEqual([3, 3, 10, 10])
  })

  test('replaces stale locale variant with the active locale when updating entries', async () => {
    const client = new Meilisearch({ host: 'abc' })
    const { meilisearchService } = createLocaleMeilisearchContext({
      entriesQuery: { locale: '*' },
      indexNames: ['customIndex'],
      extraConfig: {
        noSanitizePrivateFields: ['internal_notes'],
      },
    })

    const unpublishedEnglish = {
      attributes: { id: 1 },
      documentId: 'doc-1',
      locale: 'en',
      title: 'Draft removed',
      publishedAt: null,
    }
    const publishedFrench = {
      attributes: { id: 2 },
      documentId: 'doc-1',
      locale: 'fr',
      title: 'French kept',
      publishedAt: '2022-01-01T00:00:00.000Z',
    }

    const tasks = await meilisearchService.updateEntriesInMeilisearch({
      contentType: 'restaurant',
      entries: [unpublishedEnglish, publishedFrench],
    })

    expect(client.index('').deleteDocument).toHaveBeenCalledWith(
      'restaurant-doc-1-en',
    )
    expect(client.index('').updateDocuments).toHaveBeenCalledWith(
      [expect.objectContaining({ _meilisearch_id: 'restaurant-doc-1-fr' })],
      { primaryKey: '_meilisearch_id' },
    )
    expect(client.index('').deleteDocument).toHaveBeenCalledTimes(1)
    expect(client.index).toHaveBeenCalledWith('customIndex')
    expect(tasks).toEqual([3, 10])
  })

  test('Test updateEntriesInMeilisearch skips deletion for entries with null documentId', async () => {
    const pluginMock = jest.fn(() => ({
      service: jest.fn().mockImplementation(() => {
        return {
          async actionInBatches({ contentType = 'restaurant', callback }) {
            await callback({
              entries: [
                {
                  id: 1,
                  documentId: 'doc1',
                  title: 'title',
                  internal_notes: 'note123',
                  secret: '123',
                },
              ],
              contentType,
            })
          },
          getCollectionName: ({ contentType }) => contentType,
          addIndexedContentType: jest.fn(),
          clearFailedSyncs: jest.fn(),
          getFailedSyncQueue: jest.fn(async () => []),
          removeFailedSyncs: jest.fn(async () => 0),
          subscribeContentType: jest.fn(),
          getCredentials: () => ({}),
        }
      }),
    }))

    const client = new Meilisearch({ host: 'abc' })

    const meilisearchService = createMeilisearchService({
      strapi: {
        plugin: pluginMock,
        contentTypes: {
          restaurant: {
            attributes: {
              id: { private: false },
              title: { private: false },
              internal_notes: { private: true },
              secret: { private: true },
            },
          },
        },
        config: {
          get: jest.fn(() => ({
            restaurant: {
              indexName: ['customIndex'],
            },
          })),
        },
        log: mockLogger,
      },
      contentTypes: {
        restaurant: {
          attributes: {
            id: { private: false },
            title: { private: false },
            internal_notes: { private: true },
            secret: { private: true },
          },
        },
      },
    })

    // Entry with null documentId should not trigger a delete call
    const mockEntryValid = {
      attributes: { id: 1 },
      documentId: 'doc-valid',
      publishedAt: '2022-01-01T00:00:00.000Z',
    }

    const mockEntryNullId = {
      attributes: { id: 2 },
      documentId: null,
      publishedAt: null,
    }

    await meilisearchService.updateEntriesInMeilisearch({
      contentType: 'restaurant',
      entries: [mockEntryValid, mockEntryNullId],
    })

    // The null-documentId entry should not trigger deleteDocument
    expect(client.index('').deleteDocument).not.toHaveBeenCalled()
  })

  test('Test to get stats', async () => {
    const customStrapi = createStrapiMock({})

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const stats = await meilisearchService.getStats({
      indexUid: 'restaurant',
    })
    expect(stats).toEqual({
      numberOfDocuments: 1,
      isIndexing: false,
      fieldDistribution: {},
    })
  })

  test('Test to update the content of a collection in Meilisearch', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        entriesQuery: {
          limit: 1,
          fields: ['id'],
          filters: {},
          sort: {},
          populate: [],
          publicationState: 'preview',
        },
      },
    })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    await meilisearchService.addContentTypeInMeiliSearch({
      contentType: 'restaurant',
    })

    expect(
      customStrapi.plugin().service().actionInBatches,
    ).toHaveBeenCalledWith({
      contentType: 'restaurant',
      callback: expect.anything(),
      entriesQuery: {
        limit: 1,
        fields: ['id'],
        filters: {},
        sort: {},
        populate: [],
        publicationState: 'preview',
      },
    })
    expect(customStrapi.log.info).toHaveBeenCalledTimes(1)
    expect(customStrapi.log.info).toHaveBeenCalledWith(
      'A task to update the settings to the Meilisearch index "restaurant" has been enqueued (Task uid: undefined).',
    )
  })

  test('Test to update the content of a collection in Meilisearch with a custom index name', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: ['customIndex'],
        entriesQuery: {
          limit: 1,
          fields: ['id'],
          filters: {},
          sort: {},
          populate: [],
          publicationState: 'preview',
        },
      },
    })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    await meilisearchService.addContentTypeInMeiliSearch({
      contentType: 'restaurant',
    })

    expect(
      customStrapi.plugin().service().actionInBatches,
    ).toHaveBeenCalledWith({
      contentType: 'restaurant',
      callback: expect.anything(),
      entriesQuery: {
        limit: 1,
        fields: ['id'],
        filters: {},
        sort: {},
        populate: [],
        publicationState: 'preview',
      },
    })
    expect(customStrapi.log.info).toHaveBeenCalledTimes(1)
    expect(customStrapi.log.info).toHaveBeenCalledWith(
      'A task to update the settings to the Meilisearch index "customIndex" has been enqueued (Task uid: undefined).',
    )
  })

  test('Test to update the content of a collection in Meilisearch with a multiple index names', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: ['customIndex', 'anotherIndex'],
        entriesQuery: {
          limit: 1,
          fields: ['id'],
          filters: {},
          sort: {},
          populate: [],
          publicationState: 'preview',
        },
      },
    })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    await meilisearchService.addContentTypeInMeiliSearch({
      contentType: 'restaurant',
    })

    expect(
      customStrapi.plugin().service().actionInBatches,
    ).toHaveBeenCalledWith({
      contentType: 'restaurant',
      callback: expect.anything(),
      entriesQuery: {
        limit: 1,
        fields: ['id'],
        filters: {},
        sort: {},
        populate: [],
        publicationState: 'preview',
      },
    })
    expect(customStrapi.log.info).toHaveBeenCalledTimes(2)
    expect(customStrapi.log.info).toHaveBeenCalledWith(
      'A task to update the settings to the Meilisearch index "customIndex" has been enqueued (Task uid: undefined).',
    )
    expect(customStrapi.log.info).toHaveBeenCalledWith(
      'A task to update the settings to the Meilisearch index "anotherIndex" has been enqueued (Task uid: undefined).',
    )
  })

  test('Test to update the content of a collection in Meilisearch with a custom index name', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: 'customIndex',
        entriesQuery: {
          limit: 1,
          fields: ['id'],
          filters: {},
          sort: {},
          populate: [],
          publicationState: 'preview',
        },
      },
    })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    await meilisearchService.addContentTypeInMeiliSearch({
      contentType: 'restaurant',
    })

    expect(
      customStrapi.plugin().service().actionInBatches,
    ).toHaveBeenCalledWith({
      contentType: 'restaurant',
      callback: expect.anything(),
      entriesQuery: {
        limit: 1,
        fields: ['id'],
        filters: {},
        sort: {},
        populate: [],
        publicationState: 'preview',
      },
    })
    expect(customStrapi.log.info).toHaveBeenCalledTimes(1)
    expect(customStrapi.log.info).toHaveBeenCalledWith(
      'A task to update the settings to the Meilisearch index "customIndex" has been enqueued (Task uid: undefined).',
    )
  })

  test('selectively sanitizes the private fields from the entries', async () => {
    const pluginMock = jest.fn(() => ({
      // This rewrites only the needed methods to reach the system under test (removeSensitiveFields)
      service: jest.fn().mockImplementation(() => {
        return {
          async actionInBatches({ contentType = 'restaurant', callback }) {
            await callback({
              entries: [
                {
                  id: 1,
                  documentId: 'doc-1',
                  title: 'title',
                  internal_notes: 'note123',
                  secret: '123',
                  publishedAt: '2022-01-01T00:00:00.000Z', // In Strapi v5 - If Draft & Publish is disabled, publishedAt is set to the latest creation or edition date of the document
                },
                {
                  id: 2,
                  documentId: 'doc-2',
                  title: 'abc',
                  internal_notes: 'note234',
                  secret: '234',
                  publishedAt: '2022-01-01T00:00:00.000Z', // In Strapi v5 - If Draft & Publish is disabled, publishedAt is set to the latest creation or edition date of the document
                },
              ],
              contentType,
            })
          },
          getCollectionName: ({ contentType }) => contentType,
          addIndexedContentType: jest.fn(),
          clearFailedSyncs: jest.fn(),
          getFailedSyncQueue: jest.fn(async () => []),
          removeFailedSyncs: jest.fn(async () => 0),
          subscribeContentType: jest.fn(),
          getCredentials: () => ({}),
        }
      }),
    }))

    const service = createMeilisearchService({
      strapi: {
        plugin: pluginMock,
        contentTypes: {
          restaurant: {
            attributes: {
              id: { private: false },
              title: { private: false },
              internal_notes: { private: true },
              secret: { private: true },
            },
          },
        },
        config: {
          get: jest.fn(() => ({
            restaurant: {
              noSanitizePrivateFields: ['internal_notes'],
            },
          })),
        },
        log: mockLogger,
      },
    })

    await service.addContentTypeInMeiliSearch({ contentType: 'restaurant' })

    const client = new Meilisearch({ host: '' })
    expect(client.index).toHaveBeenCalledWith('restaurant')
    expect(client.index('restaurant').addDocuments).toHaveBeenNthCalledWith(
      1,
      [
        {
          _meilisearch_id: 'restaurant-doc-1',
          id: 1,
          documentId: 'doc-1',
          title: 'title',
          internal_notes: 'note123',
          publishedAt: '2022-01-01T00:00:00.000Z',
        },
        {
          _meilisearch_id: 'restaurant-doc-2',
          id: 2,
          documentId: 'doc-2',
          title: 'abc',
          internal_notes: 'note234',
          publishedAt: '2022-01-01T00:00:00.000Z',
        },
      ],
      { primaryKey: '_meilisearch_id' },
    )
  })

  test('Test to get content types with same index', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: 'customIndex',
      },
      aboutConfig: {
        indexName: 'customIndex',
      },
    })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const result = await meilisearchService.getContentTypesWithSameIndex({
      contentType: 'restaurant',
    })

    expect(result).toEqual(['api::restaurant.restaurant', 'api::about.about'])
  })

  test('Test to get content types with same index', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: 'customIndex',
      },
      aboutConfig: {
        indexName: 'anotherIndex',
      },
    })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const result = await meilisearchService.getContentTypesWithSameIndex({
      contentType: 'restaurant',
    })

    expect(result).toEqual(['api::restaurant.restaurant'])
  })

  test('Test to get content types with same index, edge case with multiple indexes', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: ['customIndex'],
      },
      aboutConfig: {
        indexName: ['customIndex', 'anotherIndex'],
      },
    })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const result = await meilisearchService.getContentTypesWithSameIndex({
      contentType: 'restaurant',
    })

    expect(result).toEqual(['api::restaurant.restaurant', 'api::about.about'])
  })

  describe('getContentTypesReport reachability behavior', () => {
    // The manual Meilisearch mock is shared by the whole file: capture its
    // default implementation to restore it after each test overrides it.
    const defaultImpl = Meilisearch.getMockImplementation()

    afterEach(() => {
      // @ts-ignore
      Meilisearch.mockImplementation(defaultImpl)
      // @ts-ignore
      global.strapi = strapiMock
    })

    /**
     * Build a Strapi mock with one indexed and listened content type.
     *
     * @returns {{ customStrapi: object, storeService: object }} The Strapi mock and the store service to assert on.
     */
    const setup = () => {
      const customStrapi = createStrapiMock({})
      const storeService = {
        getCredentials: jest.fn(() => ({
          host: 'http://localhost:7700',
          apiKey: 'masterKey',
        })),
        getListenedContentTypes: jest.fn(async () => [
          'api::restaurant.restaurant',
        ]),
        getIndexedContentTypes: jest.fn(async () => [
          'api::restaurant.restaurant',
        ]),
        removeIndexedContentType: jest.fn(),
      }
      const contentTypeService = {
        getContentTypesUid: jest.fn(() => ['api::restaurant.restaurant']),
        getCollectionName: jest.fn(() => 'restaurant'),
        totalNumberOfEntries: jest.fn(async () => 2),
      }

      const originalPlugin = customStrapi.plugin
      customStrapi.plugin = jest.fn(pluginName => {
        if (pluginName === 'meilisearch') {
          return {
            service: jest.fn(serviceName => {
              if (serviceName === 'store') return storeService
              if (serviceName === 'contentType') return contentTypeService
              return originalPlugin().service()
            }),
          }
        }
        return originalPlugin(pluginName)
      })

      // @ts-ignore
      global.strapi = customStrapi

      return { customStrapi, storeService }
    }

    test('keeps the stored selection when Meilisearch is unreachable', async () => {
      const { customStrapi, storeService } = setup()
      // @ts-ignore
      Meilisearch.mockImplementation(() => ({
        getStats: jest.fn(async () => {
          throw new Error('Request to http://localhost:7700/stats has failed')
        }),
      }))

      const meilisearchService = createMeilisearchService({
        strapi: customStrapi,
      })
      const reports = await meilisearchService.getContentTypesReport()

      expect(storeService.removeIndexedContentType).not.toHaveBeenCalled()
      // The stored selection is reported as is, flagged as unverified.
      expect(reports.contentTypes[0]).toMatchObject({
        contentType: 'api::restaurant.restaurant',
        indexUid: 'restaurant',
        indexed: true,
        listened: true,
        numberOfEntries: 2,
        meilisearchReachable: false,
      })
    })

    test('reports the real index state when Meilisearch is reachable', async () => {
      const { customStrapi } = setup()
      // @ts-ignore
      Meilisearch.mockImplementation(() => ({
        getStats: jest.fn(async () => ({ indexes: { restaurant: {} } })),
        index: jest.fn(() => ({
          getStats: jest.fn(async () => ({
            numberOfDocuments: 2,
            isIndexing: false,
          })),
        })),
      }))

      const meilisearchService = createMeilisearchService({
        strapi: customStrapi,
      })
      const reports = await meilisearchService.getContentTypesReport()

      expect(reports.contentTypes[0]).toMatchObject({
        indexed: true,
        numberOfDocuments: 2,
        meilisearchReachable: true,
      })
    })

    test('unselects a collection whose index is missing in Meilisearch', async () => {
      const { customStrapi, storeService } = setup()
      // @ts-ignore
      Meilisearch.mockImplementation(() => ({
        getStats: jest.fn(async () => ({ indexes: { about: {} } })),
      }))

      const meilisearchService = createMeilisearchService({
        strapi: customStrapi,
      })
      await meilisearchService.getContentTypesReport()

      expect(storeService.removeIndexedContentType).toHaveBeenCalledWith({
        contentType: 'api::restaurant.restaurant',
      })
    })
  })
})

describe('Index actions and the sync retry queue', () => {
  const RESTAURANT = 'restaurant'

  /**
   * Meilisearch service on a Strapi double whose store uses the real queue.
   *
   * @param {object} [options]
   * @param {Function} [options.actionInBatches] - Batch double; calls the callback with one entry by default.
   * @param {string[]} [options.indexed] - Indexed content types.
   */
  function setup({ actionInBatches, indexed = [RESTAURANT] } = {}) {
    const data = {}
    const connector = {
      getStoreKey: async ({ key }) =>
        data[key] === undefined
          ? undefined
          : JSON.parse(JSON.stringify(data[key])),
      setStoreKey: async ({ key, value }) => {
        data[key] = JSON.parse(JSON.stringify(value))
      },
    }
    const store = {
      ...failedSyncQueue({ store: connector }),
      getCredentials: async () => ({ host: 'http://localhost:7700' }),
      getIndexedContentTypes: async () => indexed,
      addIndexedContentType: jest.fn(),
      removeIndexedContentType: jest.fn(),
    }
    const contentType = {
      getCollectionName: ({ contentType }) => contentType,
      getContentTypeUid: ({ contentType }) => contentType,
      getEntry: jest.fn(async () => null),
      getEntries: jest.fn(async () => []),
      actionInBatches: jest.fn(
        actionInBatches ||
          (async ({ callback, contentType }) =>
            callback({
              entries: [{ id: 1, documentId: 'kept' }],
              contentType,
            })),
      ),
    }
    const services = {
      store,
      contentType,
      lifecycle: { subscribeContentType: jest.fn() },
    }
    const customStrapi = createStrapiMock({})
    customStrapi.plugin = jest.fn(() => ({ service: name => services[name] }))
    customStrapi.contentTypes = { [RESTAURANT]: { attributes: {} } }
    // @ts-ignore
    global.strapi = customStrapi
    const indexApi = {
      updateSettings: jest.fn(async () => ({ taskUid: 1 })),
      addDocuments: jest.fn(async () => ({ taskUid: 2 })),
      deleteDocuments: jest.fn(async () => ({ taskUid: 3 })),
      delete: jest.fn(async () => ({ taskUid: 4 })),
    }
    // @ts-ignore
    Meilisearch.mockImplementation(() => ({ index: jest.fn(() => indexApi) }))
    const meilisearch = createMeilisearchService({ strapi: customStrapi })
    services.meilisearch = meilisearch
    return { store, meilisearch, indexApi }
  }

  /**
   * Queue documents of the restaurant collection.
   *
   * @param {object} store - Store service.
   * @param {string[]} documentIds - Document ids.
   */
  const queue = (store, documentIds) =>
    store.addFailedSyncs({ contentType: RESTAURANT, documentIds, maxSize: 100 })

  /**
   * Document ids in the sync retry queue.
   *
   * @param {object} store - Store service.
   *
   * @returns {Promise<string[]>}
   */
  const queuedIds = async store =>
    (await store.getFailedSyncQueue()).map(item => item.documentId)

  afterEach(() => {
    // @ts-ignore
    Meilisearch.mockReset()
    // @ts-ignore
    global.strapi = strapiMock
  })

  test('a successful re-index removes the retries queued before it and keeps those queued during it', async () => {
    let store
    const services = setup({
      actionInBatches: async ({ callback, contentType }) => {
        // A write fails in the document middleware while the re-index runs.
        await queue(store, ['during'])
        return callback({
          entries: [{ id: 1, documentId: 'kept' }],
          contentType,
        })
      },
    })
    store = services.store
    const { meilisearch } = services
    await queue(store, ['before'])

    await meilisearch.addContentTypeInMeiliSearch({ contentType: RESTAURANT })

    expect(await queuedIds(store)).toEqual(['during'])
  })

  test('a re-index keeps retries queued while its settings were updated', async () => {
    const { store, meilisearch, indexApi } = setup()
    indexApi.updateSettings.mockImplementation(async () => {
      await queue(store, ['during-settings'])
      return { taskUid: 1 }
    })

    await meilisearch.addContentTypeInMeiliSearch({ contentType: RESTAURANT })

    expect(await queuedIds(store)).toEqual(['during-settings'])
  })

  test('a failed re-index keeps the queued retries', async () => {
    const { store, meilisearch } = setup({
      actionInBatches: async () => {
        throw new Error('Request to http://localhost:7700 has failed')
      },
    })
    await queue(store, ['before'])

    await expect(
      meilisearch.addContentTypeInMeiliSearch({ contentType: RESTAURANT }),
    ).rejects.toThrow('has failed')
    expect(await queuedIds(store)).toEqual(['before'])
  })

  test('updating an indexed collection with its own index leaves no queued retries', async () => {
    const { store, meilisearch, indexApi } = setup()
    jest
      .spyOn(meilisearch, 'getContentTypesWithSameIndex')
      .mockResolvedValue([RESTAURANT])
    await queue(store, ['before'])

    await meilisearch.updateContentTypeInMeiliSearch({
      contentType: RESTAURANT,
    })

    expect(indexApi.delete).toHaveBeenCalled()
    expect(await queuedIds(store)).toEqual([])
  })

  test('removing a collection with its own index clears its queued retries', async () => {
    const { store, meilisearch, indexApi } = setup()
    jest
      .spyOn(meilisearch, 'getContentTypesWithSameIndex')
      .mockResolvedValue([RESTAURANT])
    await queue(store, ['before'])
    await store.addFailedSyncs({
      contentType: 'about',
      documentIds: ['other'],
      maxSize: 100,
    })

    await meilisearch.emptyOrDeleteIndex({ contentType: RESTAURANT })

    expect(indexApi.delete).toHaveBeenCalled()
    expect(await store.getFailedSyncQueue()).toMatchObject([
      { contentType: 'about', documentId: 'other' },
    ])
  })

  test('emptying a shared index first removes documents that were deleted during an outage', async () => {
    const { store, meilisearch, indexApi } = setup()
    jest
      .spyOn(meilisearch, 'getContentTypesWithSameIndex')
      .mockResolvedValue([RESTAURANT, 'about'])
    // Deleted from Strapi while Meilisearch was down: the batch cannot find it.
    await queue(store, ['gone'])

    await meilisearch.emptyOrDeleteIndex({ contentType: RESTAURANT })

    const deletedIds = indexApi.deleteDocuments.mock.calls.flatMap(
      ([ids]) => ids,
    )
    expect(deletedIds).toEqual(
      expect.arrayContaining(['restaurant-gone', 'restaurant-kept']),
    )
    expect(indexApi.delete).not.toHaveBeenCalled()
    expect(await queuedIds(store)).toEqual([])
  })

  test('emptying a shared index only deletes queued documents, so one that fails to index cannot block it', async () => {
    const { store, meilisearch, indexApi } = setup()
    jest
      .spyOn(meilisearch, 'getContentTypesWithSameIndex')
      .mockResolvedValue([RESTAURANT, 'about'])
    const reject = jest.fn(async () => {
      throw new Error('Payload Too Large')
    })
    indexApi.addDocuments = reject
    indexApi.updateDocuments = reject
    // Still in Strapi, but no longer matching the indexing filters.
    strapi
      .plugin('meilisearch')
      .service('contentType')
      .getEntry.mockResolvedValue({ id: 2, documentId: 'filtered' })
    await queue(store, ['filtered'])

    await meilisearch.emptyOrDeleteIndex({ contentType: RESTAURANT })

    expect(reject).not.toHaveBeenCalled()
    expect(
      indexApi.deleteDocuments.mock.calls.flatMap(([ids]) => ids),
    ).toContain('restaurant-filtered')
    expect(await queuedIds(store)).toEqual([])
  })
})
