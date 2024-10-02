import createMeilisearchService from '../services/meilisearch'

import { createStrapiMock } from '../__mocks__/strapi'
jest.mock('meilisearch')

const strapiMock = createStrapiMock({})
global.strapi = strapiMock

describe('Test Meilisearch plugin configurations', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test with no meilisearch configurations', async () => {
    const customStrapi = createStrapiMock({})

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test with empty meilisearch configurations', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {},
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test with wrong type meilisearch configurations', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: 1,
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration undefined indexName', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {},
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })

    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with non-empty type indexName', async () => {
    const customIndexName = 'customName'
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: [customIndexName],
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })

    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([customIndexName])
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with non-empty and several indexName', async () => {
    const customIndexName = 'customName'
    const customIndexName2 = 'otherCustomName'
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: [customIndexName, customIndexName2],
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })

    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([customIndexName, customIndexName2])
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with indexName that is not an array', async () => {
    const customIndexName = 'customName'
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: customIndexName,
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })

    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([customIndexName])
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with undefined transformEntry ', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        transformEntry: undefined,
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([{ id: 1 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with correct transformEntry ', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        transformEntry: ({ entry }) => {
          return {
            ...entry,
            name: 'hello',
          }
        },
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([
      { id: 1, name: 'hello' },
      { id: 2, name: 'hello' },
    ])
    expect(settings).toEqual({})
  })

  test('Test configuration with correct filterEntry ', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        filterEntry: ({ entry }) => {
          return entry.id !== 1
        },
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = await meilisearchService.filterEntries({
      contentType,
      entries: [
        { id: 1, name: 'one' },
        { id: 2, name: 'two' },
      ],
    })

    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([{ id: 2, name: 'two' }])
    expect(settings).toEqual({})
  })

  test('Test configuration with throwing transformEntry ', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        transformEntry: () => {
          throw new Error('failed')
        },
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([])
    expect(settings).toEqual({})
  })

  test('Test configuration with no return transformEntry ', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        transformEntry: () => {},
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([])
    expect(settings).toEqual({})
  })

  test('Test configuration to remove unpublished entries', async () => {
    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: strapiMock,
    })

    const entries = meilisearchService.removeUnpublishedArticles({
      contentType,
      entries: [
        { id: 1, publishedAt: null },
        { id: 2, publishedAt: null },
      ],
    })

    expect(entries).toEqual([])
  })

  test('Test should remove unwanted entries with a specific language', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        entriesQuery: {
          locale: 'fr',
        },
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const entries = meilisearchService.removeLocaleEntries({
      contentType,
      entries: [
        { id: 1, locale: 'fr' },
        { id: 2, locale: 'en' },
      ],
    })

    expect(entries).toEqual([{ id: 1, locale: 'fr' }])
  })

  test('Test should keep unpublished entries when status is set to draft', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        transformEntry: () => {},
        entriesQuery: {
          status: 'draft',
        },
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = meilisearchService.removeUnpublishedArticles({
      contentType,
      entries: [
        { id: 1, publishedAt: null },
        { id: 2, publishedAt: null },
      ],
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([
      { id: 1, publishedAt: null },
      { id: 2, publishedAt: null },
    ])
  })

  test('Test configuration with empty settings ', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        settings: {},
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([{ id: 1 }, { id: 2 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with undefined settings ', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        settings: undefined,
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([{ id: 1 }, { id: 2 }])
    expect(settings).toEqual({})
  })

  test('Test configuration with correct settings ', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        settings: {
          mySettings: 'hello',
        },
      },
    })

    const contentType = 'restaurant'
    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })
    const indexNames = meilisearchService.getIndexNamesOfContentType({
      contentType,
    })
    const entries = await meilisearchService.transformEntries({
      contentType,
      entries: [{ id: 1 }, { id: 2 }],
    })
    const settings = meilisearchService.getSettings({
      contentType,
    })

    expect(indexNames).toEqual([contentType])
    expect(entries).toEqual([{ id: 1 }, { id: 2 }])
    expect(settings).toEqual({
      mySettings: 'hello',
    })
  })

  test('Test all contentTypes pointing to the same custom index name', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: ['my_index'],
      },
      aboutConfig: {
        indexName: ['my_index'],
      },
    })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const contentTypes = meilisearchService.listContentTypesWithCustomIndexName(
      {
        indexName: 'my_index',
      },
    )

    expect(contentTypes).toEqual(['restaurant', 'about'])
  })

  test('Test all contentTypes pointing to the same custom index name, with multiple index names', async () => {
    const customStrapi = createStrapiMock({
      restaurantConfig: {
        indexName: ['another_index', 'my_index'],
      },
      aboutConfig: {
        indexName: ['my_index', 'another_index2'],
      },
    })

    const meilisearchService = createMeilisearchService({
      strapi: customStrapi,
    })

    const contentTypes = meilisearchService.listContentTypesWithCustomIndexName(
      {
        indexName: 'my_index',
      },
    )

    expect(contentTypes).toEqual(['restaurant', 'about'])
  })
})
