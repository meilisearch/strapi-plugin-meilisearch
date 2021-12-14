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

  const fakeGetAPIConfig = jest.fn(({ apiName }) => {
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
    getAPIConfig: fakeGetAPIConfig,
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

  const fakeStrapi = {
    log: fakeLogger,
    service: fakeService,
    plugin: fakePlugin,
    contentTypes,
    api: fakeApi,
  }
  return fakeStrapi
}

module.exports = {
  createFakeStrapi,
  apis,
}
