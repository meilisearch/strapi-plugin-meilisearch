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

  const fakeEntityService = {
    findMany: fakeFindMany,
  }

  const fakeStrapi = {
    log: fakeLogger,
    service: fakeService,
    plugin: fakePlugin,
    contentTypes,
    api: fakeApi,
    config: fakeConfig,
    db: fakeDb,
    entityService: fakeEntityService,
  }
  return fakeStrapi
}

module.exports = {
  createFakeStrapi,
  apis,
}
