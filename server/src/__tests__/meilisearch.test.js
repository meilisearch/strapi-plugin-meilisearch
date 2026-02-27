import createMeilisearchService from '../services/meilisearch'

import { MeiliSearch as Meilisearch } from 'meilisearch'
import { createStrapiMock, mockLogger } from '../__mocks__/strapi'

jest.mock('meilisearch')

const strapiMock = createStrapiMock({})

// @ts-ignore
global.strapi = strapiMock

describe('Tests content types', () => {
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
                  title: 'title',
                  internal_notes: 'note123',
                  secret: '123',
                },
                {
                  id: 2,
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
                  title: 'title',
                  internal_notes: 'note123',
                  secret: '123',
                },
                {
                  id: 2,
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
      entriesId: [1, 2],
    })

    expect(customStrapi.log.info).toHaveBeenCalledTimes(1)
    expect(customStrapi.log.info).toHaveBeenCalledWith(
      'A task to delete 2 documents of the index "customIndex" in Meilisearch has been enqueued (Task uid: undefined).',
    )
    expect(client.index('').deleteDocuments).toHaveBeenCalledTimes(1)
    expect(client.index('').deleteDocuments).toHaveBeenCalledWith([
      'restaurant-1',
      'restaurant-2',
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
      entriesId: [1, 2],
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
      'restaurant-1',
      'restaurant-2',
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
                  title: 'title',
                  internal_notes: 'note123',
                  secret: '123',
                },
                {
                  id: 2,
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
})
