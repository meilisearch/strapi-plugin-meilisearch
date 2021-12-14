const createContentTypeService = require('../services/content-types')

const { createFakeStrapi } = require('./utils/fakes')

const fakeStrapi = createFakeStrapi({})
global.strapi = fakeStrapi

describe('Tests content types', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test all api names', async () => {
    const contentTypeServices = createContentTypeService({ strapi: fakeStrapi })

    const apiNames = contentTypeServices.getApisName({ strapi: fakeStrapi })

    expect(apiNames).toEqual(['about', 'movie', 'restaurant'])
  })

  test('Test all api names of an empty content type', async () => {
    const customStrapi = createFakeStrapi({ contentTypes: [] })
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })

    const apiNames = contentTypeServices.getApisName({
      strapi: customStrapi,
    })

    expect(apiNames).toEqual([])
  })

  test('Test all content types name', async () => {
    const contentTypeServices = createContentTypeService({ strapi: fakeStrapi })
    const contentTypes = contentTypeServices.getContentTypesName()

    expect(contentTypes).toEqual([
      'api::about.about',
      'api::movie.movie',
      'api::restaurant.restaurant',
    ])
  })

  test('Test names of empty content types', async () => {
    const customStrapi = createFakeStrapi({ contentTypes: [] })
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })

    const contentTypes = contentTypeServices.getContentTypesName({
      strapi: customStrapi,
    })

    expect(contentTypes).toEqual([])
  })

  test('Test all content types ', async () => {
    const contentTypeServices = createContentTypeService({ strapi: fakeStrapi })
    const contentTypes = contentTypeServices.getContentTypes()

    expect(Object.keys(contentTypes)).toEqual([
      'api::about.about',
      'api::movie.movie',
      'api::restaurant.restaurant',
    ])
  })

  test('Test empty content types', async () => {
    const customStrapi = createFakeStrapi({ contentTypes: [] })
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })

    const contentTypes = contentTypeServices.getContentTypesName({
      strapi: customStrapi,
    })

    expect(Object.keys(contentTypes)).toEqual([])
  })
})

describe('Test content types utils', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test all api names', async () => {
    const contentTypeServices = createContentTypeService({ strapi: fakeStrapi })

    const apiNames = contentTypeServices.getApisName({ strapi: fakeStrapi })

    expect(apiNames).toEqual(['about', 'movie', 'restaurant'])
  })

  test('Test all api names of an empty content type', async () => {
    const customStrapi = createFakeStrapi({ contentTypes: [] })
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })

    const apiNames = contentTypeServices.getApisName({
      strapi: customStrapi,
    })

    expect(apiNames).toEqual([])
  })

  test('Test all content types name', async () => {
    const contentTypeServices = createContentTypeService({ strapi: fakeStrapi })
    const contentTypes = contentTypeServices.getContentTypesName()

    expect(contentTypes).toEqual([
      'api::about.about',
      'api::movie.movie',
      'api::restaurant.restaurant',
    ])
  })

  test('Test names of empty content types', async () => {
    const customStrapi = createFakeStrapi({ contentTypes: [] })
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })

    const contentTypes = contentTypeServices.getContentTypesName({
      strapi: customStrapi,
    })

    expect(contentTypes).toEqual([])
  })

  test('Test all content types ', async () => {
    const contentTypeServices = createContentTypeService({ strapi: fakeStrapi })
    const contentTypes = contentTypeServices.getContentTypes()

    expect(Object.keys(contentTypes)).toEqual([
      'api::about.about',
      'api::movie.movie',
      'api::restaurant.restaurant',
    ])
  })

  test('Test empty content types', async () => {
    const customStrapi = createFakeStrapi({ contentTypes: [] })
    const contentTypeServices = createContentTypeService({
      strapi: customStrapi,
    })

    const contentTypes = contentTypeServices.getContentTypesName({
      strapi: customStrapi,
    })

    expect(Object.keys(contentTypes)).toEqual([])
  })
})
