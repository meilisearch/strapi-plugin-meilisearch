import createContentTypeService from '../services/content-types'

import { createStrapiMock } from '../__mocks__/strapi'

const strapiMock = createStrapiMock({})
global.strapi = strapiMock

describe('Tests content types', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test all api names of an empty content type', async () => {
    const customStrapi = createStrapiMock({ contentTypes: [] })
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })

    const apiNames = contentTypeServices.getContentTypesUid()

    expect(apiNames).toEqual([])
  })

  test('Test all content types', async () => {
    const contentTypeServices = createContentTypeService({ strapi: strapiMock })
    const contentTypes = contentTypeServices.getContentTypesUid()

    expect(contentTypes.sort()).toEqual(
      [
        'api::about.about',
        'api::article.article',
        'api::movie.movie',
        'api::restaurant.restaurant',
        'plugin::users-permissions.user',
      ].sort(),
    )
  })

  test('Test names of empty content types', async () => {
    const customStrapi = createStrapiMock({ contentTypes: [] })
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })

    const contentTypes = contentTypeServices.getContentTypesUid()

    expect(contentTypes).toEqual([])
  })

  test('Test empty content types', async () => {
    const customStrapi = createStrapiMock({ contentTypes: [] })
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })

    const contentTypes = contentTypeServices.getContentTypesUid()

    expect(Object.keys(contentTypes)).toEqual([])
  })

  test('Test if content type exists', async () => {
    const contentTypeServices = createContentTypeService({
      strapi: strapiMock,
    })

    const exists = contentTypeServices.getContentTypeUid({
      contentType: 'api::restaurant.restaurant',
    })

    expect(exists).toEqual('api::restaurant.restaurant')
  })

  test('Test number of entries', async () => {
    const contentTypeServices = createContentTypeService({
      strapi: strapiMock,
    })

    const count = await contentTypeServices.numberOfEntries({
      contentType: 'api::restaurant.restaurant',
    })

    expect(count).toEqual(1)
  })

  test('Test total number of entries', async () => {
    const contentTypeServices = createContentTypeService({
      strapi: strapiMock,
    })

    const count = await contentTypeServices.totalNumberOfEntries({
      contentTypes: [
        'api::restaurant.restaurant',
        'api::movie.movie',
        'not existent',
      ],
    })

    expect(count).toEqual(2)
  })

  test('Test fetching entries of a content type with default parameters', async () => {
    const contentTypeServices = createContentTypeService({
      strapi: strapiMock,
    })

    const count = await contentTypeServices.getEntries({
      contentType: 'api::restaurant.restaurant',
    })

    expect(strapiMock.documents('').findMany).toHaveBeenCalledWith({
      fields: '*',
      start: 0,
      limit: 500,
      filters: {},
      sort: 'id',
      populate: '*',
      status: 'published',
    })
    expect(strapiMock.documents('').findMany).toHaveBeenCalledTimes(1)
    expect(count).toEqual([{ id: 1 }])
  })

  test('Test fetching entries of a content type with custom parameters', async () => {
    const contentTypeServices = createContentTypeService({
      strapi: strapiMock,
    })

    const count = await contentTypeServices.getEntries({
      contentType: 'api::restaurant.restaurant',
      fields: 'title',
      start: 1,
      limit: 2,
      filters: { where: { title: 'hello' } },
      sort: 'id',
      populate: {},
      status: 'published',
    })

    expect(strapiMock.documents('').findMany).toHaveBeenCalledWith({
      fields: 'title',
      start: 1,
      limit: 2,
      filters: { where: { title: 'hello' } },
      sort: 'id',
      populate: {},
      status: 'published',
    })
    expect(strapiMock.documents('').findMany).toHaveBeenCalledTimes(1)
    expect(count).toEqual([{ id: 1 }])
  })

  test('Test fetching entries on non existing content type', async () => {
    const contentTypeServices = createContentTypeService({
      strapi: strapiMock,
    })

    const entry = await contentTypeServices.getEntries({
      contentType: 'api::test.test',
    })

    expect(strapiMock.documents('').findMany).toHaveBeenCalledTimes(0)
    expect(entry).toEqual([])
  })

  test('Test fetching an entry of a content type with default parameters', async () => {
    const contentTypeServices = createContentTypeService({
      strapi: strapiMock,
    })

    const entry = await contentTypeServices.getEntry({
      contentType: 'api::restaurant.restaurant',
      documentId: '200',
    })

    expect(strapiMock.documents('').findOne).toHaveBeenCalledWith({
      documentId: '200',
      fields: '*',
      populate: '*',
      locale: undefined,
      status: 'published',
    })
    expect(strapiMock.documents('').findOne).toHaveBeenCalledTimes(1)
    expect(entry).toEqual([{ id: 1 }])
  })

  test('Test fetching an entry of a content type with custom parameters', async () => {
    const contentTypeServices = createContentTypeService({
      strapi: strapiMock,
    })

    const entry = await contentTypeServices.getEntry({
      contentType: 'api::restaurant.restaurant',
      documentId: '200',
      entriesQuery: {
        fields: ['title'],
        populate: {
          subClass: true,
        },
      },
    })

    expect(strapiMock.documents('').findOne).toHaveBeenCalledWith({
      documentId: '200',
      fields: ['title'],
      populate: {
        subClass: true,
      },
      locale: undefined,
      status: 'published',
    })
    expect(strapiMock.documents('').findOne).toHaveBeenCalledTimes(1)
    expect(entry).toEqual([{ id: 1 }])
  })

  test('Test fetching an entry on a non existing content type', async () => {
    const contentTypeServices = createContentTypeService({
      strapi: strapiMock,
    })

    const count = await contentTypeServices.getEntry({
      contentType: 'api::test.test',
    })

    expect(strapiMock.documents('').findOne).toHaveBeenCalledTimes(0)
    expect(count).toEqual({})
  })

  test('Test operation in batches on entries', async () => {
    const contentTypeServices = createContentTypeService({
      strapi: strapiMock,
    })

    const contentType = 'api::restaurant.restaurant'
    const entries = await contentTypeServices.actionInBatches({
      contentType: contentType,
      callback: ({ entries, contentType }) =>
        entries.map(entry => ({
          id: entry.id + 1,
          contentType,
        })),
    })

    expect(entries[0].id).toEqual(2)
    expect(entries[0].contentType).toEqual(contentType)
  })

  test('getEntry returns null when entry is not found', async () => {
    const customStrapi = createStrapiMock({})
    // Override findOne to return null (entry not found)
    customStrapi.documents.mockImplementation(() => ({
      findMany: jest.fn(() => []),
      findOne: jest.fn(() => null),
      count: jest.fn(() => 0),
    }))

    const contentTypeService = createContentTypeService({
      strapi: customStrapi,
    })
    const result = await contentTypeService.getEntry({
      contentType: 'api::restaurant.restaurant',
      documentId: 'nonexistent-doc-id',
    })

    expect(result).toBeNull()
  })

  test('Test operation in batches on entries with callback returning nothing', async () => {
    const contentTypeServices = createContentTypeService({
      strapi: strapiMock,
    })

    const contentType = 'api::restaurant.restaurant'
    const entries = await contentTypeServices.actionInBatches({
      contentType: contentType,
      callback: () => {},
    })

    expect(entries).toEqual([])
  })
})
