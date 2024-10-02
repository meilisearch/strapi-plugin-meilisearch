import { validatePluginConfig } from '../config/configuration-validation'

import { createStrapiMock } from '../__mocks__/strapi'

const strapiMock = createStrapiMock({})
global.strapi = strapiMock

describe('Test plugin configuration', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  test('Test empty configuration', async () => {
    validatePluginConfig()
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test wrong type config configuration', async () => {
    validatePluginConfig(1)
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "config" field in the Meilisearch plugin configuration should be an object',
    )
  })

  test('Test wrong object configuration', async () => {
    validatePluginConfig({})
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with not used attribute', async () => {
    validatePluginConfig({
      hello: 0,
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The collection "hello" configuration should be of type object',
    )
  })

  test('Test configuration with empty host', async () => {
    validatePluginConfig({
      host: undefined,
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with empty string host', async () => {
    validatePluginConfig({
      host: '',
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "host" option should be a non-empty string',
    )
  })

  test('Test configuration with string host', async () => {
    validatePluginConfig({
      host: 'test',
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with empty apiKey', async () => {
    validatePluginConfig({
      apiKey: undefined,
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with wrong time apiKey', async () => {
    validatePluginConfig({
      apiKey: 0,
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "apiKey" option should be a string',
    )
  })

  test('Test configuration with empty string apiKey', async () => {
    validatePluginConfig({
      apiKey: '',
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with string apiKey', async () => {
    validatePluginConfig({
      apiKey: 'test',
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with string apiKey', async () => {
    validatePluginConfig({
      apiKey: 'test',
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test indexName with empty string', async () => {
    validatePluginConfig({
      restaurant: {
        indexName: '',
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "indexName" option of "restaurant" should be a non-empty string or an array of non-empty strings',
    )
  })

  test('Test indexName with non-empty string', async () => {
    validatePluginConfig({
      restaurant: {
        indexName: 'validName',
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test indexName with empty array', async () => {
    validatePluginConfig({
      restaurant: {
        indexName: [],
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "indexName" option of "restaurant" should be a non-empty string or an array of non-empty strings',
    )
  })

  test('Test indexName with non-empty array containing empty string', async () => {
    validatePluginConfig({
      restaurant: {
        indexName: [''],
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "indexName" option of "restaurant" should be a non-empty string or an array of non-empty strings',
    )
  })

  test('Test indexName with non-empty array of strings', async () => {
    validatePluginConfig({
      restaurant: {
        indexName: ['validName1', 'validName2'],
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test indexName with undefined', async () => {
    validatePluginConfig({
      restaurant: {
        indexName: undefined,
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test transformEntry with wrong type', async () => {
    validatePluginConfig({
      restaurant: {
        transformEntry: 0,
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "transformEntry" option of "restaurant" should be a function',
    )
  })

  test('Test transformEntry with function', async () => {
    validatePluginConfig({
      restaurant: {
        transformEntry: () => {},
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test transformEntry with undefined', async () => {
    validatePluginConfig({
      restaurant: {
        transformEntry: undefined,
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test filterEntry with wrong type', async () => {
    validatePluginConfig({
      restaurant: {
        filterEntry: 0,
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "filterEntry" option of "restaurant" should be a function',
    )
  })

  test('Test filterEntry with function', async () => {
    validatePluginConfig({
      restaurant: {
        filterEntry: () => {},
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test filterEntry with undefined', async () => {
    validatePluginConfig({
      restaurant: {
        filterEntry: undefined,
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test settings with wrong type', async () => {
    validatePluginConfig({
      restaurant: {
        settings: 0,
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "settings" option of "restaurant" should be an object',
    )
  })

  test('Test settings with function', async () => {
    validatePluginConfig({
      restaurant: {
        settings: () => {},
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
  })

  test('Test settings with undefined', async () => {
    validatePluginConfig({
      restaurant: {
        settings: undefined,
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test noSanitizePrivateFields with wrong type', async () => {
    validatePluginConfig({
      restaurant: {
        noSanitizePrivateFields: 0,
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "noSanitizePrivateFields" option of "restaurant" should be an array of strings.',
    )
  })

  test('Test noSanitizePrivateFields with array of strings', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        noSanitizePrivateFields: ['test'],
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.noSanitizePrivateFields).toEqual(['test'])
  })

  test('Test noSanitizePrivateFields with undefined', async () => {
    validatePluginConfig({
      restaurant: {
        noSanitizePrivateFields: undefined,
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
  })

  test('Test configuration with random field ', async () => {
    validatePluginConfig({
      restaurant: {
        random: undefined,
      },
    })
    expect(strapiMock.log.warn).toHaveBeenCalledTimes(1)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.warn).toHaveBeenCalledWith(
      'The "random" option of "restaurant" is not a known option',
    )
  })
})

describe('Test entriesQuery configuration', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  // ENTRIES QUERY
  test('entriesQuery as number should log error', async () => {
    validatePluginConfig({
      restaurant: {
        entriesQuery: 0,
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "entriesQuery" option of "restaurant" should be an object',
    )
  })

  test('entriesQuery as undefined should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: undefined,
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toBeUndefined()
  })

  test('entriesQuery as object should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {},
      },
    })

    expect(configuration.restaurant.entriesQuery).toEqual({})
  })

  // FIELDS
  test('fields as undefined should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          fields: undefined,
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({})
  })

  test('fields as array of string should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          fields: ['test'],
        },
      },
    })

    expect(configuration.restaurant.entriesQuery).toEqual({ fields: ['test'] })
  })

  test('fields as a none-array of string should log error', async () => {
    validatePluginConfig({
      restaurant: {
        entriesQuery: {
          fields: 0,
        },
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "fields" option in "queryOptions" of "restaurant" should be an array of strings.',
    )
  })

  // FILTERS
  test('filters as undefined should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          filters: undefined,
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({})
  })

  test('filters as an object should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          filters: {},
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({ filters: {} })
  })

  test('Filters as a none-object should log error', async () => {
    validatePluginConfig({
      restaurant: {
        entriesQuery: {
          filters: 0,
        },
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "filters" option in "queryOptions" of "restaurant" should be an object.',
    )
  })

  // START
  test('Presence of start option should log error', async () => {
    validatePluginConfig({
      restaurant: {
        entriesQuery: {
          start: 0,
        },
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "start" option in "queryOptions" of "restaurant" is forbidden.',
    )
  })

  // LIMIT
  test('limit as undefined should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          limit: undefined,
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({})
  })

  test('limit as a number higher than 1 should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          limit: 1,
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({ limit: 1 })
  })

  test('limit at 0 should log error', async () => {
    validatePluginConfig({
      restaurant: {
        entriesQuery: {
          limit: 0,
        },
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "limit" option in "queryOptions" of "restaurant" should be a number higher than 0.',
    )
  })

  test('limit as a none-number should log error', async () => {
    validatePluginConfig({
      restaurant: {
        entriesQuery: {
          limit: 'a',
        },
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "limit" option in "queryOptions" of "restaurant" should be a number higher than 0.',
    )
  })

  // SORT
  test('sort as undefined should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          sort: undefined,
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({})
  })

  test('sort as an object should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          sort: {},
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({ sort: {} })
  })

  test('sort as a string should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          sort: 'a',
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({ sort: 'a' })
  })

  test('sort as an array of strings should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          sort: ['a'],
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({ sort: ['a'] })
  })

  test('sort as a none-object should log error', async () => {
    validatePluginConfig({
      restaurant: {
        entriesQuery: {
          sort: 0,
        },
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "sort" option in "queryOptions" of "restaurant" should be an object/array/string.',
    )
  })

  // POPULATE
  test('populate as undefined should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          populate: undefined,
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({})
  })

  test('populate as an object should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          populate: {},
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({ populate: {} })
  })

  test('populate as a string should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          populate: 'a',
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({ populate: 'a' })
  })

  test('populate as an array of strings should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          populate: ['a'],
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({ populate: ['a'] })
  })

  test('populate as a none-object should log error', async () => {
    validatePluginConfig({
      restaurant: {
        entriesQuery: {
          populate: 0,
        },
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "populate" option in "queryOptions" of "restaurant" should be an object/array/string.',
    )
  })

  // PUBLICATION STATE

  test('publicationState as undefined should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          publicationState: undefined,
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({})
  })

  test('publicationState as "live" should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          publicationState: 'live',
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({
      publicationState: 'live',
    })
  })

  test('publicationState as "preview" should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          publicationState: 'preview',
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({
      publicationState: 'preview',
    })
  })

  test('publicationState a none accepted string value should log error', async () => {
    validatePluginConfig({
      restaurant: {
        entriesQuery: {
          publicationState: 'incorrect',
        },
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "publicationState" option in "queryOptions" of "restaurant" should be either "preview" or "live".',
    )
  })

  test('publicationState as a none-string should log error', async () => {
    validatePluginConfig({
      restaurant: {
        entriesQuery: {
          publicationState: 0,
        },
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "publicationState" option in "queryOptions" of "restaurant" should be either "preview" or "live".',
    )
  })

  // Locale
  test('locale as undefined should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          locale: undefined,
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({})
  })

  test('locale as "all" should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          locale: 'all',
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({
      locale: 'all',
    })
  })

  test('locale as a random string should succeed', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          locale: 'random',
        },
      },
    })

    expect(strapiMock.log.warn).toHaveBeenCalledTimes(0)
    expect(strapiMock.log.error).toHaveBeenCalledTimes(0)
    expect(configuration.restaurant.entriesQuery).toEqual({
      locale: 'random',
    })
  })

  test('locale as a none-string should log error', async () => {
    validatePluginConfig({
      restaurant: {
        entriesQuery: {
          locale: 0,
        },
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "locale" option in "queryOptions" of "restaurant" should be a non-empty string.',
    )
  })

  // UNKNOWN FIELDS

  test('Unknown fields in entriesQuery should log a warning', async () => {
    const configuration = validatePluginConfig({
      restaurant: {
        entriesQuery: {
          random: 0,
        },
      },
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      'The "random" option in "queryOptions" of "restaurant" is not a known option. Check the "findMany" API references in the Strapi Documentation.',
    )

    expect(configuration.restaurant.entriesQuery.random).toBeUndefined()
  })
})
