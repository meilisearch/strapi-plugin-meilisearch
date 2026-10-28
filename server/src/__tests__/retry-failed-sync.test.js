import failedSyncQueue from '../services/store/failed-sync-queue'
import { queueFailedSync } from '../services/document-middleware/failed-sync-queue'
import { retryFailedSyncs } from '../services/document-middleware/retry-failed-sync'
import registerDocumentMiddleware from '../services/document-middleware/index.js'
import { validatePluginConfig } from '../config/configuration-validation'
import bootstrap from '../bootstrap'
import { mockLogger } from '../__mocks__/strapi'

const RESTAURANT = 'api::restaurant.restaurant'

/**
 * In-memory replacement of the plugin store connector.
 */
function createMemoryStoreConnector() {
  const data = {}
  return {
    data,
    getStoreKey: jest.fn(async ({ key }) => data[key]),
    setStoreKey: jest.fn(async ({ key, value }) => {
      data[key] = value
    }),
  }
}

/**
 * Store service with the real queue functions on top of an in-memory connector.
 *
 * @param {object} [options]
 * @param {string[]} [options.listened] - Listened content types.
 */
function createStoreService({ listened = [RESTAURANT] } = {}) {
  const connector = createMemoryStoreConnector()
  return {
    connector,
    getListenedContentTypes: jest.fn(async () => listened),
    ...failedSyncQueue({ store: connector }),
  }
}

/**
 * Strapi double exposing the plugin services used by the retry feature.
 *
 * @param {object} options
 * @param {object} options.store - Store service.
 * @param {object} [options.meilisearch] - Meilisearch service overrides.
 * @param {object} [options.contentType] - Content type service overrides.
 * @param {object} [options.pluginConfig] - `plugin::meilisearch` configuration.
 */
function createStrapi({
  store,
  meilisearch = {},
  contentType = {},
  pluginConfig = {},
}) {
  const services = {
    store,
    meilisearch: {
      fetchIndexUids: jest.fn(async () => ['restaurant']),
      entriesQuery: jest.fn(() => ({})),
      updateEntriesInMeilisearch: jest.fn(async () => []),
      deleteEntriesFromMeiliSearch: jest.fn(async () => []),
      ...meilisearch,
    },
    contentType: {
      getEntry: jest.fn(async ({ documentId }) => ({ id: 1, documentId })),
      getEntries: jest.fn(async () => []),
      ...contentType,
    },
  }
  return {
    services,
    strapi: {
      log: mockLogger,
      config: { get: jest.fn(() => pluginConfig) },
      plugin: jest.fn(() => ({ service: name => services[name] })),
    },
  }
}

const enabled = { retryFailedSync: { rule: '*/5 * * * *' } }

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Failed sync queue (store)', () => {
  test('deduplicates documents and keeps insertion order', async () => {
    const store = createStoreService()

    await store.addFailedSyncs({
      contentType: RESTAURANT,
      documentIds: ['a', 'b', 'a'],
      maxSize: 10,
    })
    await store.addFailedSyncs({
      contentType: RESTAURANT,
      documentIds: ['b', 'c'],
      maxSize: 10,
    })

    expect(await store.getFailedSyncQueue()).toEqual([
      { contentType: RESTAURANT, documentId: 'a' },
      { contentType: RESTAURANT, documentId: 'b' },
      { contentType: RESTAURANT, documentId: 'c' },
    ])
  })

  test('drops documents beyond the maximum size and reports them', async () => {
    const store = createStoreService()

    const result = await store.addFailedSyncs({
      contentType: RESTAURANT,
      documentIds: ['a', 'b', 'c'],
      maxSize: 2,
    })

    expect(result).toEqual({ added: 2, dropped: 1 })
    expect(await store.getFailedSyncQueue()).toHaveLength(2)
  })

  test('concurrent additions do not overwrite each other', async () => {
    const store = createStoreService()

    await Promise.all(
      ['a', 'b', 'c', 'd'].map(documentId =>
        store.addFailedSyncs({
          contentType: RESTAURANT,
          documentIds: [documentId],
          maxSize: 10,
        }),
      ),
    )

    expect(
      (await store.getFailedSyncQueue()).map(item => item.documentId).sort(),
    ).toEqual(['a', 'b', 'c', 'd'])
  })

  test('removes only the given documents', async () => {
    const store = createStoreService()
    await store.addFailedSyncs({
      contentType: RESTAURANT,
      documentIds: ['a', 'b'],
      maxSize: 10,
    })

    const remaining = await store.removeFailedSyncs({
      items: [{ contentType: RESTAURANT, documentId: 'a' }],
    })

    expect(remaining).toBe(1)
    expect(await store.getFailedSyncQueue()).toEqual([
      { contentType: RESTAURANT, documentId: 'b' },
    ])
  })
})

describe('Queueing failed syncs', () => {
  test('does nothing when retryFailedSync is not configured', async () => {
    const store = createStoreService()
    const { strapi } = createStrapi({ store })

    await queueFailedSync({
      strapi,
      contentType: RESTAURANT,
      documentIds: ['a'],
    })

    expect(await store.getFailedSyncQueue()).toEqual([])
  })

  test('queues the documents when retryFailedSync is configured', async () => {
    const store = createStoreService()
    const { strapi } = createStrapi({ store, pluginConfig: enabled })

    await queueFailedSync({
      strapi,
      contentType: RESTAURANT,
      documentIds: ['a'],
    })

    expect(await store.getFailedSyncQueue()).toEqual([
      { contentType: RESTAURANT, documentId: 'a' },
    ])
  })

  test('logs an error when the queue is full', async () => {
    const store = createStoreService()
    const { strapi } = createStrapi({
      store,
      pluginConfig: { retryFailedSync: { rule: '* * * * *', maxQueueSize: 1 } },
    })

    await queueFailedSync({
      strapi,
      contentType: RESTAURANT,
      documentIds: ['a', 'b'],
    })

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('sync retry queue is full'),
    )
  })

  test('never throws when the store fails', async () => {
    const store = {
      addFailedSyncs: jest.fn(async () => {
        throw new Error('db down')
      }),
    }
    const { strapi } = createStrapi({ store, pluginConfig: enabled })

    await expect(
      queueFailedSync({ strapi, contentType: RESTAURANT, documentIds: ['a'] }),
    ).resolves.toBeUndefined()
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('could not queue failed sync'),
    )
  })
})

describe('Document middleware queues failed syncs', () => {
  /**
   * Run one `update` through the real middleware with a failing Meilisearch.
   *
   * @param {object} pluginConfig - `plugin::meilisearch` configuration.
   */
  async function runFailingUpdate(pluginConfig) {
    const store = createStoreService()
    const { strapi } = createStrapi({
      store,
      pluginConfig,
      meilisearch: {
        updateEntriesInMeilisearch: jest.fn(async () => {
          throw new Error('Request to http://localhost:7700 has failed')
        }),
      },
    })
    let handler
    strapi.documents = { use: fn => (handler = fn) }
    await registerDocumentMiddleware({ strapi })

    const result = { id: 1, documentId: 'doc-1' }
    const returned = await handler(
      { uid: RESTAURANT, action: 'update', params: { documentId: 'doc-1' } },
      async () => result,
    )
    return { store, returned, result }
  }

  test('queues the document and still returns the Strapi result', async () => {
    const { store, returned, result } = await runFailingUpdate(enabled)

    expect(returned).toBe(result)
    expect(await store.getFailedSyncQueue()).toEqual([
      { contentType: RESTAURANT, documentId: 'doc-1' },
    ])
  })

  test('does not queue when the feature is off', async () => {
    const { store } = await runFailingUpdate({})

    expect(await store.getFailedSyncQueue()).toEqual([])
  })
})

describe('Retrying failed syncs', () => {
  /**
   * Store with queued documents.
   *
   * @param {string[]} documentIds - Queued restaurant document ids.
   * @param {object} [options] - Store options.
   */
  async function queuedStore(documentIds, options) {
    const store = createStoreService(options)
    await store.addFailedSyncs({
      contentType: RESTAURANT,
      documentIds,
      maxSize: 100,
    })
    return store
  }

  test('skips the run while Meilisearch is unreachable and keeps the queue', async () => {
    const store = await queuedStore(['a'])
    const { strapi, services } = createStrapi({
      store,
      meilisearch: {
        fetchIndexUids: jest.fn(async () => {
          throw new Error('Request to http://localhost:7700/stats has failed')
        }),
      },
    })

    expect(await retryFailedSyncs({ strapi })).toBeNull()
    expect(
      services.meilisearch.updateEntriesInMeilisearch,
    ).not.toHaveBeenCalled()
    expect(await store.getFailedSyncQueue()).toHaveLength(1)
  })

  test('indexes the current Strapi state of a document that still exists', async () => {
    const store = await queuedStore(['a'])
    const { strapi, services } = createStrapi({
      store,
      contentType: {
        getEntry: jest.fn(async () => ({
          id: 7,
          documentId: 'a',
          title: 'current',
        })),
      },
    })

    expect(await retryFailedSyncs({ strapi })).toEqual({
      retried: 1,
      remaining: 0,
    })
    expect(
      services.meilisearch.updateEntriesInMeilisearch,
    ).toHaveBeenCalledWith({
      contentType: RESTAURANT,
      entries: [{ id: 7, documentId: 'a', title: 'current' }],
    })
    expect(await store.getFailedSyncQueue()).toEqual([])
  })

  test('removes a document from the index when it no longer exists in Strapi', async () => {
    const store = await queuedStore(['gone'])
    const { strapi, services } = createStrapi({
      store,
      contentType: { getEntry: jest.fn(async () => null) },
    })

    await retryFailedSyncs({ strapi })

    expect(
      services.meilisearch.updateEntriesInMeilisearch,
    ).not.toHaveBeenCalled()
    expect(
      services.meilisearch.deleteEntriesFromMeiliSearch,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: RESTAURANT,
        documentIds: ['gone'],
      }),
    )
    expect(await store.getFailedSyncQueue()).toEqual([])
  })

  test('drops documents of content types that are no longer listened', async () => {
    const store = await queuedStore(['a'], { listened: [] })
    const { strapi, services } = createStrapi({ store })

    await retryFailedSyncs({ strapi })

    expect(services.contentType.getEntry).not.toHaveBeenCalled()
    expect(await store.getFailedSyncQueue()).toEqual([])
  })

  test('stops at the first failure and keeps the remaining documents', async () => {
    const store = await queuedStore(['a', 'b', 'c'])
    const updateEntriesInMeilisearch = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('Request has failed'))
    const { strapi } = createStrapi({
      store,
      meilisearch: { updateEntriesInMeilisearch },
    })

    expect(await retryFailedSyncs({ strapi })).toEqual({
      retried: 1,
      remaining: 2,
    })
    expect(
      (await store.getFailedSyncQueue()).map(item => item.documentId),
    ).toEqual(['b', 'c'])
    expect(updateEntriesInMeilisearch).toHaveBeenCalledTimes(2)
  })

  test('does not start a second run while one is in progress', async () => {
    const store = await queuedStore(['a'])
    let release
    const { strapi } = createStrapi({
      store,
      meilisearch: {
        updateEntriesInMeilisearch: jest.fn(
          () => new Promise(resolve => (release = resolve)),
        ),
      },
    })

    const first = retryFailedSyncs({ strapi })
    // Wait until the first run is blocked in the pending update (the refetch
    // before it is deferred).
    for (let i = 0; i < 100 && !release; i++) {
      await new Promise(resolve => setTimeout(resolve, 1))
    }
    expect(release).toBeInstanceOf(Function)
    expect(await retryFailedSyncs({ strapi })).toBeNull()

    release([])
    expect(await first).toEqual({ retried: 1, remaining: 0 })
  })
})

describe('retryFailedSync configuration', () => {
  beforeEach(() => {
    // @ts-ignore
    global.strapi = { log: mockLogger }
  })

  test('accepts a rule and an optional maxQueueSize without treating them as a collection', () => {
    const configuration = {
      retryFailedSync: { rule: '*/5 * * * *', maxQueueSize: 500 },
    }

    validatePluginConfig(configuration)

    expect(configuration.retryFailedSync).toEqual({
      rule: '*/5 * * * *',
      maxQueueSize: 500,
    })
    expect(mockLogger.error).not.toHaveBeenCalled()
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  test.each([
    ['not an object', true],
    ['missing rule', {}],
    ['empty rule', { rule: ' ' }],
    ['invalid maxQueueSize', { rule: '* * * * *', maxQueueSize: 0 }],
  ])('disables the feature for an invalid option (%s)', (_, option) => {
    const configuration = { retryFailedSync: option }

    validatePluginConfig(configuration)

    expect(configuration).not.toHaveProperty('retryFailedSync')
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('retryFailedSync'),
    )
  })
})

describe('Bootstrap registers the retry job', () => {
  /**
   * Strapi double for the bootstrap with a reachable Meilisearch.
   *
   * @param {object} pluginConfig - `plugin::meilisearch` configuration.
   */
  function createBootstrapStrapi(pluginConfig) {
    const services = {
      store: {
        syncCredentials: jest.fn(),
        getIndexedContentTypes: jest.fn(async () => []),
        removeIndexedContentType: jest.fn(),
        emptyListenedContentTypes: jest.fn(),
      },
      lifecycle: { subscribeContentType: jest.fn() },
      meilisearch: {
        fetchIndexUids: jest.fn(async () => []),
        getIndexNamesOfContentType: jest.fn(() => []),
      },
      contentType: { getContentTypesUid: jest.fn(() => []) },
    }
    const strapi = {
      log: mockLogger,
      config: { get: jest.fn(() => pluginConfig) },
      cron: { add: jest.fn() },
      plugin: jest.fn(() => ({ service: name => services[name] })),
      admin: {
        services: {
          permission: { actionProvider: { registerMany: jest.fn() } },
        },
      },
    }
    // @ts-ignore
    global.strapi = strapi
    return strapi
  }

  test('adds a named cron job with the configured rule', async () => {
    const strapi = createBootstrapStrapi(enabled)

    await bootstrap({ strapi })

    expect(strapi.cron.add).toHaveBeenCalledWith({
      'meilisearch-retry-failed-sync': {
        task: expect.any(Function),
        options: { rule: '*/5 * * * *' },
      },
    })
  })

  test('adds no job when the feature is off', async () => {
    const strapi = createBootstrapStrapi({})

    await bootstrap({ strapi })

    expect(strapi.cron.add).not.toHaveBeenCalled()
  })
})
