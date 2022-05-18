const { validateConfiguration } = require('../configuration-validation')

const { createFakeStrapi } = require('./utils/fakes')

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
      'The `config` field in the Meilisearch plugin configuration must be of type object'
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
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The collection "hello" should be of type object'
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
      '`host` should be a non-empty string in Meilisearch configuration'
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
      '`apiKey` should be a string in Meilisearch configuration'
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

  test('Test configuration with string apiKey', async () => {
    validateConfiguration({
      apiKey: 'test',
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test indexName with empty string', async () => {
    validateConfiguration({
      restaurant: {
        indexName: '',
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'the "indexName" param of "restaurant" should be a non-empty string'
    )
  })

  test('Test indexName with non-empty string', async () => {
    validateConfiguration({
      restaurant: {
        indexName: 'hello',
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test indexName with undefined', async () => {
    validateConfiguration({
      restaurant: {
        indexName: undefined,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test transformEntry with wrong type', async () => {
    validateConfiguration({
      restaurant: {
        transformEntry: 0,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'the "transformEntry" param of "restaurant" should be a function'
    )
  })

  test('Test transformEntry with function', async () => {
    validateConfiguration({
      restaurant: {
        transformEntry: () => {},
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test transformEntry with undefined', async () => {
    validateConfiguration({
      restaurant: {
        transformEntry: undefined,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test settings with wrong type', async () => {
    validateConfiguration({
      restaurant: {
        settings: 0,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'the "settings" param of "restaurant" should be an object'
    )
  })

  test('Test settings with function', async () => {
    validateConfiguration({
      restaurant: {
        settings: {},
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test settings with undefined', async () => {
    validateConfiguration({
      restaurant: {
        settings: undefined,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with random field ', async () => {
    validateConfiguration({
      restaurant: {
        random: undefined,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.warn).toHaveBeenCalledWith(
      'The attribute "random" of "restaurant" is not a known parameter'
    )
  })
})
