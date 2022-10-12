const defaultContentTypes = require('./content-types-list')

/**
 * @param {object} config
 * @param  {object} [config.restaurantConfig]
 * @param  {object} [config.aboutConfig]
 * @param  {object} [config.contentTypes]
 */
function createFakeStrapi({
  restaurantConfig = {},
  aboutConfig = {},
  contentTypes,
}) {
  contentTypes = contentTypes || defaultContentTypes

  const fakePlugin = jest.fn(() => ({
    service: fakePluginService,
  }))

  const fakePluginService = jest.fn(() => ({
    getContentTypesUid: () => ['restaurant', 'about'],
    getCollectionName: ({ contentType }) => contentType,
    getCredentials: () => ({
      host: 'http://localhost:7700',
      apiKey: 'masterKey',
      ApiKeyIsFromConfigFile: true,
      HostIsFromConfigFile: true,
    }),
  }))

  const fakeLogger = {
    error: jest.fn(() => {}),
    warn: jest.fn(() => {}),
    info: jest.fn(() => {}),
  }

  const fakeConfig = {
    get: jest.fn(() => {
      return {
        restaurant: restaurantConfig,
        about: aboutConfig,
      }
    }),
  }

  const fakeFindWithCount = jest.fn(() => {
    return 1
  })
  const fakeDb = {
    query: jest.fn(() => ({
      count: fakeFindWithCount,
    })),
  }

  const fakeFindMany = jest.fn(() => {
    return [{ id: 1 }]
  })

  const fakeFindOne = jest.fn(() => {
    return [{ id: 1 }]
  })

  const fakeEntityService = {
    findMany: fakeFindMany,
    findOne: fakeFindOne,
  }

  const fakeStrapi = {
    log: fakeLogger,
    plugin: fakePlugin,
    contentTypes,
    config: fakeConfig,
    db: fakeDb,
    entityService: fakeEntityService,
  }
  return fakeStrapi
}

module.exports = {
  createFakeStrapi,
}
