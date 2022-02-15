const defaultContentTypes = require('./content-types-list')

const apis = {
  restaurant: 'restaurant',
  about: 'about',
}

function createFakeStrapi({
  restaurantConfig = {},
  aboutConfig = {},
  contentTypes = defaultContentTypes,
}) {
  const fakeService = jest.fn(api => {
    if (api == 'restaurant') {
      return {
        ...restaurantConfig,
      }
    } else if (api == 'about') {
      return {
        ...aboutConfig,
      }
    }
  })

  const fakePlugin = jest.fn(() => ({
    service: fakePluginService,
  }))

  const fakeGetApiFunction = jest.fn(() => {
    return ['restaurant', 'about']
  })

  const fakeGetAPIServices = jest.fn(({ apiName }) => {
    if (apiName == 'restaurant') {
      return {
        ...restaurantConfig,
      }
    } else if (apiName == 'about') {
      return {
        ...aboutConfig,
      }
    }
  })

  const fakePluginService = jest.fn(() => ({
    getApisName: fakeGetApiFunction,
    getAPIServices: fakeGetAPIServices,
  }))

  const fakeLogger = {
    error: jest.fn(() => {}),
    warn: jest.fn(() => {}),
  }
  const fakeApi = {
    restaurant: {
      services: {
        restaurant: {
          meilisearch: restaurantConfig,
        },
      },
    },
    about: {
      services: {
        about: {
          meilisearch: aboutConfig,
        },
      },
    },
  }

  const fakeConfig = {
    get: jest.fn(() => {
      return {
        restaurant: {},
      }
    }),
  }
  const fakeStrapi = {
    log: fakeLogger,
    service: fakeService,
    plugin: fakePlugin,
    contentTypes,
    api: fakeApi,
    config: fakeConfig,
  }
  return fakeStrapi
}

module.exports = {
  createFakeStrapi,
  apis,
}
