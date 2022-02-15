const {
  validateConfiguration,
  validateAllConfigurations,
  validateApiConfig,
} = require('../configuration-validation')

const { createFakeStrapi, apis } = require('./utils/fakes')

const fakeStrapi = createFakeStrapi({})
global.strapi = fakeStrapi

describe('Test plugin configuration', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test empty configuration', async () => {
    validateConfiguration()
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test wrong type config configuration', async () => {
    validateConfiguration(1)
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The `config` field in the MeiliSearch plugin configuration must be of type object'
    )
  })

  test('Test wrong object configuration', async () => {
    validateConfiguration({})
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with not used attribute', async () => {
    validateConfiguration({
      hello: 0,
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.warn).toHaveBeenCalledWith(
      'The field "hello" in the MeiliSearch plugin config is not a valid parameter'
    )
  })

  test('Test configuration with empty host', async () => {
    validateConfiguration({
      host: undefined,
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with empty string host', async () => {
    validateConfiguration({
      host: '',
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      '`host` should be a non-empty string in MeiliSearch configuration'
    )
  })

  test('Test configuration with string host', async () => {
    validateConfiguration({
      host: 'test',
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with empty apiKey', async () => {
    validateConfiguration({
      apiKey: undefined,
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with wrong time apiKey', async () => {
    validateConfiguration({
      apiKey: 0,
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      '`apiKey` should be a string in MeiliSearch configuration'
    )
  })

  test('Test configuration with empty string apiKey', async () => {
    validateConfiguration({
      apiKey: '',
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with string apiKey', async () => {
    validateConfiguration({
      apiKey: 'test',
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })
})

describe('Test API configurations', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Tests all APIs', async () => {
    validateAllConfigurations({ strapi: fakeStrapi })

    expect(fakeStrapi.plugin().service().getApisName).toHaveBeenCalledTimes(1)
    expect(
      fakeStrapi.plugin().service().getApisName.mock.results[0].value
    ).toEqual(['restaurant', 'about'])
  })

  test('Test with no meilisearch configurations', async () => {
    const customStrapi = createFakeStrapi({})
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })

    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(0)
    expect(customStrapi.plugin().service().getAPIConfig).toHaveBeenCalledWith({
      apiName: apis.restaurant,
    })
  })

  test('Test with empty meilisearch configurations', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: { meilisearch: {} },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })

    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test with wrong type meilisearch configurations', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: { meilisearch: 0 },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })

    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(customStrapi.log.error).toHaveBeenCalledWith(
      'The "meilisearch" configuration in the restaurant service should be of type object'
    )
  })

  test('Test api with empty string indexName parameter', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        meilisearch: {
          indexName: '',
        },
      },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })
    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(1)
  })

  test('Test configuration with wrong type indexName', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        meilisearch: {
          indexName: 0,
        },
      },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })
    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(1)
  })

  test('Test configuration with non-empty type indexName', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        meilisearch: {
          indexName: 'hello',
        },
      },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })
    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with undefined transformEntry ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        meilisearch: {
          transformEntry: undefined,
        },
      },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })
    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with wrong type transformEntry ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        meilisearch: {
          transformEntry: 0,
        },
      },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })
    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(1)
  })

  test('Test configuration with function type transformEntry ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        meilisearch: {
          transformEntry: () => {},
        },
      },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })
    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with undefined settings ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        meilisearch: {
          settings: undefined,
        },
      },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })
    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with wrong type settings ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        meilisearch: {
          settings: 0,
        },
      },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })
    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(1)
  })

  test('Test configuration with object type settings ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        meilisearch: {
          settings: {},
        },
      },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })

    expect(customStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with none supported field ', async () => {
    const customStrapi = createFakeStrapi({
      restaurantConfig: {
        meilisearch: {
          transformEntry: () => {},
          wrongField: 0,
        },
      },
    })
    validateApiConfig({
      strapi: customStrapi,
      apiName: apis.restaurant,
    })
    expect(customStrapi.log.warn).toHaveBeenCalledTimes(1)
    expect(customStrapi.log.error).toHaveBeenCalledTimes(0)
  })
})
