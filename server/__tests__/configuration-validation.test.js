const { validatePluginConfig } = require('../configuration-validation')

const { createFakeStrapi } = require('./utils/fakes')

const fakeStrapi = createFakeStrapi({})
global.strapi = fakeStrapi

describe('Test plugin configuration', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test empty configuration', async () => {
    validatePluginConfig()
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test wrong type config configuration', async () => {
    validatePluginConfig(1)
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The "config" field in the Meilisearch plugin configuration should be an object'
    )
  })

  test('Test wrong object configuration', async () => {
    validatePluginConfig({})
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with not used attribute', async () => {
    validatePluginConfig({
      hello: 0,
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The collection "hello" configuration should be of type object'
    )
  })

  test('Test configuration with empty host', async () => {
    validatePluginConfig({
      host: undefined,
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with empty string host', async () => {
    validatePluginConfig({
      host: '',
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The "host" option should be a non-empty string'
    )
  })

  test('Test configuration with string host', async () => {
    validatePluginConfig({
      host: 'test',
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with empty apiKey', async () => {
    validatePluginConfig({
      apiKey: undefined,
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with wrong time apiKey', async () => {
    validatePluginConfig({
      apiKey: 0,
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The "apiKey" option should be a string'
    )
  })

  test('Test configuration with empty string apiKey', async () => {
    validatePluginConfig({
      apiKey: '',
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with string apiKey', async () => {
    validatePluginConfig({
      apiKey: 'test',
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with string apiKey', async () => {
    validatePluginConfig({
      apiKey: 'test',
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test indexName with empty string', async () => {
    validatePluginConfig({
      restaurant: {
        indexName: '',
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The "indexName" option of "restaurant" should be a non-empty string'
    )
  })

  test('Test indexName with non-empty string', async () => {
    validatePluginConfig({
      restaurant: {
        indexName: 'hello',
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test indexName with undefined', async () => {
    validatePluginConfig({
      restaurant: {
        indexName: undefined,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test transformEntry with wrong type', async () => {
    validatePluginConfig({
      restaurant: {
        transformEntry: 0,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The "transformEntry" option of "restaurant" should be a function'
    )
  })

  test('Test transformEntry with function', async () => {
    validatePluginConfig({
      restaurant: {
        transformEntry: () => {},
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test transformEntry with undefined', async () => {
    validatePluginConfig({
      restaurant: {
        transformEntry: undefined,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test filterEntry with wrong type', async () => {
    validatePluginConfig({
      restaurant: {
        filterEntry: 0,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The "filterEntry" option of "restaurant" should be a function'
    )
  })

  test('Test filterEntry with function', async () => {
    validatePluginConfig({
      restaurant: {
        filterEntry: () => {},
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test filterEntry with undefined', async () => {
    validatePluginConfig({
      restaurant: {
        filterEntry: undefined,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test settings with wrong type', async () => {
    validatePluginConfig({
      restaurant: {
        settings: 0,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The "settings" option of "restaurant" should be an object'
    )
  })

  test('Test settings with function', async () => {
    validatePluginConfig({
      restaurant: {
        settings: () => {},
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
  })

  test('Test settings with undefined', async () => {
    validatePluginConfig({
      restaurant: {
        settings: undefined,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test populateEntryRule with wrong type', async () => {
    validatePluginConfig({
      restaurant: {
        populateEntryRule: 0,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The "populateEntryRule" option of "restaurant" should be an object/array/string'
    )
  })

  test('Test populateEntryRule with function', async () => {
    validatePluginConfig({
      restaurant: {
        populateEntryRule: () => {},
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledWith(
      'The "populateEntryRule" option of "restaurant" should be an object/array/string'
    )
  })

  test('Test populateEntryRule with empty object', async () => {
    validatePluginConfig({
      restaurant: {
        populateEntryRule: {},
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test populateEntryRule with undefined', async () => {
    validatePluginConfig({
      restaurant: {
        populateEntryRule: undefined,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with random field ', async () => {
    validatePluginConfig({
      restaurant: {
        random: undefined,
      },
    })
    expect(fakeStrapi.log.warn).toHaveBeenCalledTimes(1)
    expect(fakeStrapi.log.error).toHaveBeenCalledTimes(0)
    expect(fakeStrapi.log.warn).toHaveBeenCalledWith(
      'The "random" option of "restaurant" is not a known option'
    )
  })
})
