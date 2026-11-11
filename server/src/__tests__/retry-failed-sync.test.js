import failedSyncQueue from '../services/store/failed-sync-queue'
import { queueFailedSync } from '../services/document-middleware/failed-sync-queue'
import { retryFailedSyncs } from '../services/document-middleware/retry-failed-sync'
import registerDocumentMiddleware from '../services/document-middleware/index.js'
import { validatePluginConfig } from '../config/configuration-validation'
import bootstrap from '../bootstrap'
import destroy from '../destroy'
import { mockLogger } from '../__mocks__/strapi'

const RESTAURANT = 'api::restaurant.restaurant'

/**
 * In-memory replacement of the plugin store connector.
 */
function createMemoryStoreConnector() {
  const data = {}
  return {
    data,
    // Copies like the real core store, which stores and parses JSON.
    getStoreKey: jest.fn(async ({ key }) =>
      data[key] === undefined
        ? undefined
        : JSON.parse(JSON.stringify(data[key])),
    ),
    setStoreKey: jest.fn(async ({ key, value }) => {
      data[key] = JSON.parse(JSON.stringify(value))
    }),
  }
}

/**
 * Store service with the real queue functions on top of an in-memory connector.
 *
 * @param {object} [options]
 * @param {string[]} [options.listened] - Listened content types.
 * @param {string[]} [options.indexed] - Indexed content types.
 */
function createStoreService({
  listened = [RESTAURANT],
  indexed = [RESTAURANT],
} = {}) {
  const connector = createMemoryStoreConnector()
  return {
    connector,
    getListenedContentTypes: jest.fn(async () => listened),
    getIndexedContentTypes: jest.fn(async () => indexed),
    listened,
    indexed,
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

const enabled = { syncOptions: { retry: { rule: '*/5 * * * *' } } }

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

    expect(
      (await store.getFailedSyncQueue()).map(item => item.documentId),
    ).toEqual(['a', 'b', 'c'])
  })

  test('a failure queued again keeps a newer generation that a stale removal does not delete', async () => {
    const store = createStoreService()
    await store.addFailedSyncs({
      contentType: RESTAURANT,
      documentIds: ['a'],
      maxSize: 10,
    })
    const [snapshot] = await store.getFailedSyncQueue()

    await store.addFailedSyncs({
      contentType: RESTAURANT,
      documentIds: ['a'],
      maxSize: 10,
    })
    const remaining = await store.removeFailedSyncs({ items: [snapshot] })

    expect(remaining).toBe(1)
    const [requeued] = await store.getFailedSyncQueue()
    expect(requeued.documentId).toBe('a')
    expect(requeued.generation).not.toBe(snapshot.generation)
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

    const [processedItem] = await store.getFailedSyncQueue()

    const remaining = await store.removeFailedSyncs({
      items: [processedItem],
    })

    expect(remaining).toBe(1)
    expect(await store.getFailedSyncQueue()).toMatchObject([
      { contentType: RESTAURANT, documentId: 'b' },
    ])
  })

  test('clears only the documents of the given content type', async () => {
    const store = createStoreService()
    await store.addFailedSyncs({
      contentType: RESTAURANT,
      documentIds: ['a', 'b'],
      maxSize: 10,
    })
    await store.addFailedSyncs({
      contentType: 'api::about.about',
      documentIds: ['c'],
      maxSize: 10,
    })

    expect(await store.clearFailedSyncs({ contentType: RESTAURANT })).toBe(2)
    expect(await store.getFailedSyncQueue()).toMatchObject([
      { contentType: 'api::about.about', documentId: 'c' },
    ])
  })
})

describe('Queueing failed syncs', () => {
  test('does nothing when syncOptions.retry is not configured', async () => {
    const store = createStoreService()
    const { strapi } = createStrapi({ store })

    await queueFailedSync({
      strapi,
      contentType: RESTAURANT,
      documentIds: ['a'],
    })

    expect(await store.getFailedSyncQueue()).toEqual([])
  })

  test('queues the documents when syncOptions.retry is configured', async () => {
    const store = createStoreService()
    const { strapi } = createStrapi({ store, pluginConfig: enabled })

    await queueFailedSync({
      strapi,
      contentType: RESTAURANT,
      documentIds: ['a'],
    })

    expect(await store.getFailedSyncQueue()).toMatchObject([
      { contentType: RESTAURANT, documentId: 'a' },
    ])
  })

  test('logs an error when the queue is full', async () => {
    const store = createStoreService()
    const { strapi } = createStrapi({
      store,
      pluginConfig: {
        syncOptions: { retry: { rule: '* * * * *', maxQueueSize: 1 } },
      },
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
    expect(await store.getFailedSyncQueue()).toMatchObject([
      { contentType: RESTAURANT, documentId: 'doc-1' },
    ])
  })

  test('does not queue when the feature is off', async () => {
    const { store } = await runFailingUpdate({})

    expect(await store.getFailedSyncQueue()).toEqual([])
  })

  test('does not queue when the Strapi write itself fails', async () => {
    const store = createStoreService()
    const { strapi } = createStrapi({ store, pluginConfig: enabled })
    let handler
    strapi.documents = { use: fn => (handler = fn) }
    await registerDocumentMiddleware({ strapi })

    await expect(
      handler(
        { uid: RESTAURANT, action: 'update', params: { documentId: 'doc-1' } },
        async () => {
          throw new Error('validation failed')
        },
      ),
    ).rejects.toThrow('validation failed')
    expect(await store.getFailedSyncQueue()).toEqual([])
  })

  test('queues a delete whose Meilisearch sync fails', async () => {
    const store = createStoreService()
    const { strapi } = createStrapi({
      store,
      pluginConfig: enabled,
      meilisearch: {
        deleteEntriesFromMeiliSearch: jest.fn(async () => {
          throw new Error('Request to http://localhost:7700 has failed')
        }),
      },
    })
    let handler
    strapi.documents = { use: fn => (handler = fn) }
    await registerDocumentMiddleware({ strapi })

    await handler(
      { uid: RESTAURANT, action: 'delete', params: { documentId: 'doc-1' } },
      async () => ({ documentId: 'doc-1', entries: [] }),
    )

    expect(await store.getFailedSyncQueue()).toMatchObject([
      { contentType: RESTAURANT, documentId: 'doc-1' },
    ])
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

  test('keeps documents of listened content types that are not indexed right now', async () => {
    const store = await queuedStore(['a'], { indexed: [] })
    const { strapi, services } = createStrapi({ store })

    await retryFailedSyncs({ strapi })

    expect(services.contentType.getEntry).not.toHaveBeenCalled()
    expect(
      services.meilisearch.updateEntriesInMeilisearch,
    ).not.toHaveBeenCalled()
    expect(await store.getFailedSyncQueue()).toMatchObject([
      { contentType: RESTAURANT, documentId: 'a' },
    ])
  })

  test('does not sync a document whose content type was un-indexed during the refetch', async () => {
    const store = await queuedStore(['a'])
    const { strapi, services } = createStrapi({
      store,
      contentType: {
        getEntry: jest.fn(async ({ documentId }) => {
          store.indexed.length = 0 // un-index while the refetch runs
          return { id: 1, documentId }
        }),
      },
    })

    await retryFailedSyncs({ strapi })

    expect(
      services.meilisearch.updateEntriesInMeilisearch,
    ).not.toHaveBeenCalled()
  })

  test('a failing document does not block the others while Meilisearch is reachable', async () => {
    const store = await queuedStore(['a', 'b', 'c'])
    const updateEntriesInMeilisearch = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('invalid document'))
      .mockResolvedValueOnce([])
    const { strapi } = createStrapi({
      store,
      meilisearch: { updateEntriesInMeilisearch },
    })

    expect(await retryFailedSyncs({ strapi })).toEqual({
      retried: 2,
      remaining: 1,
    })
    expect(
      (await store.getFailedSyncQueue()).map(item => item.documentId),
    ).toEqual(['b'])
    expect(updateEntriesInMeilisearch).toHaveBeenCalledTimes(3)
  })

  test('stops when Meilisearch becomes unreachable and keeps the remaining documents', async () => {
    const store = await queuedStore(['a', 'b', 'c'])
    const updateEntriesInMeilisearch = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('Request has failed'))
    const fetchIndexUids = jest
      .fn()
      .mockResolvedValueOnce(['restaurant'])
      .mockRejectedValueOnce(new Error('Request has failed'))
    const { strapi } = createStrapi({
      store,
      meilisearch: { updateEntriesInMeilisearch, fetchIndexUids },
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

  test('keeps a failure queued again while the run was processing the same document', async () => {
    const store = await queuedStore(['a', 'b'])
    const updateEntriesInMeilisearch = jest
      .fn()
      .mockImplementationOnce(async () => [])
      .mockImplementationOnce(async () => {
        // While b is synced, a fails again in the document middleware.
        await store.addFailedSyncs({
          contentType: RESTAURANT,
          documentIds: ['a'],
          maxSize: 100,
        })
        return []
      })
    const { strapi } = createStrapi({
      store,
      meilisearch: { updateEntriesInMeilisearch },
    })

    expect(await retryFailedSyncs({ strapi })).toEqual({
      retried: 2,
      remaining: 1,
    })
    expect(
      (await store.getFailedSyncQueue()).map(item => item.documentId),
    ).toEqual(['a'])
  })

  describe('all-locale indexes', () => {
    /**
     * Strapi double with an all-locale index and the locales en and fr.
     *
     * @param {object} store - Store service.
     * @param {Function} getEntries - Locale-aware refetch double.
     */
    function createLocaleStrapi(store, getEntries) {
      const { strapi, services } = createStrapi({
        store,
        meilisearch: { entriesQuery: jest.fn(() => ({ locale: '*' })) },
        contentType: { getEntries },
      })
      const plugin = strapi.plugin
      strapi.plugin = jest.fn(name =>
        name === 'i18n'
          ? {
              service: () => ({
                find: async () => [{ code: 'en' }, { code: 'fr' }],
              }),
            }
          : plugin(name),
      )
      return { strapi, services }
    }

    test('removes every locale variant and the base document of a deleted document', async () => {
      const store = await queuedStore(['gone'])
      const { strapi, services } = createLocaleStrapi(
        store,
        jest.fn(async () => []),
      )

      await retryFailedSyncs({ strapi })

      const deleted =
        services.meilisearch.deleteEntriesFromMeiliSearch.mock.calls.map(
          ([options]) => ({
            ids: options.documentIds,
            locales: options.locales,
          }),
        )
      expect(deleted).toEqual(
        expect.arrayContaining([
          { ids: ['gone'], locales: undefined },
          { ids: ['gone'], locales: ['en', 'fr'] },
        ]),
      )
      expect(await store.getFailedSyncQueue()).toEqual([])
    })

    test('indexes the remaining locale and removes the one that is gone', async () => {
      const store = await queuedStore(['a'])
      const { strapi, services } = createLocaleStrapi(
        store,
        jest.fn(async () => [{ id: 1, documentId: 'a', locale: 'en' }]),
      )

      await retryFailedSyncs({ strapi })

      expect(
        services.meilisearch.updateEntriesInMeilisearch,
      ).toHaveBeenCalledWith({
        contentType: RESTAURANT,
        entries: [{ id: 1, documentId: 'a', locale: 'en' }],
      })
      expect(
        services.meilisearch.deleteEntriesFromMeiliSearch,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ documentIds: ['a'], locales: ['fr'] }),
      )
    })
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

describe('syncOptions configuration', () => {
  beforeEach(() => {
    // @ts-ignore
    global.strapi = { log: mockLogger }
  })

  test('accepts syncOptions.retry without treating syncOptions as a collection', () => {
    const configuration = {
      syncOptions: { retry: { rule: '*/5 * * * *', maxQueueSize: 500 } },
      restaurant: {},
    }

    validatePluginConfig(configuration)

    expect(configuration.syncOptions).toEqual({
      retry: { rule: '*/5 * * * *', maxQueueSize: 500 },
    })
    expect(mockLogger.error).not.toHaveBeenCalled()
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  test.each([
    ['not an object', true],
    ['missing rule', {}],
    ['empty rule', { rule: ' ' }],
    ['rule not in cron format', { rule: 'not-a-cron' }],
    ['rule with too few fields', { rule: 'every 5 min' }],
    ['invalid maxQueueSize', { rule: '* * * * *', maxQueueSize: 0 }],
  ])('disables the retry for an invalid option (%s)', (_, retry) => {
    const configuration = { syncOptions: { retry } }

    validatePluginConfig(configuration)

    expect(configuration.syncOptions).toEqual({})
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('syncOptions.retry'),
    )
  })

  test('drops a syncOptions value that is not an object', () => {
    const configuration = { syncOptions: 'yes' }

    validatePluginConfig(configuration)

    expect(configuration).not.toHaveProperty('syncOptions')
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('"syncOptions"'),
    )
  })

  test('warns about unknown syncOptions keys', () => {
    const configuration = { syncOptions: { retyr: {} } }

    validatePluginConfig(configuration)

    expect(configuration.syncOptions).toEqual({})
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('"retyr"'),
    )
  })
})

describe('Bootstrap registers the retry job', () => {
  /**
   * Strapi double for the bootstrap with a reachable Meilisearch.
   *
   * @param {object} pluginConfig - `plugin::meilisearch` configuration.
   * @param {object} [options]
   * @param {boolean} [options.cronEnabled] - Value of `server.cron.enabled`; unset keeps Strapi's default.
   */
  function createBootstrapStrapi(pluginConfig, { cronEnabled } = {}) {
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
      config: {
        get: jest.fn((key, defaultValue) => {
          if (key === 'server.cron.enabled') {
            return cronEnabled === undefined ? defaultValue : cronEnabled
          }
          return pluginConfig
        }),
      },
      cron: { add: jest.fn(), remove: jest.fn() },
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
    const strapi = createBootstrapStrapi(enabled, { cronEnabled: true })

    await bootstrap({ strapi })

    expect(strapi.cron.add).toHaveBeenCalledWith({
      'meilisearch-retry-failed-sync': {
        task: expect.any(Function),
        options: { rule: '*/5 * * * *' },
      },
    })
  })

  test.each([
    ['disabled', false],
    ['unset (Strapi default)', undefined],
  ])(
    'adds no job and warns when server.cron.enabled is %s',
    async (_, cronEnabled) => {
      const strapi = createBootstrapStrapi(enabled, { cronEnabled })

      await bootstrap({ strapi })

      expect(strapi.cron.add).not.toHaveBeenCalled()
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('server.cron.enabled'),
      )
    },
  )

  test('adds no job when the feature is off', async () => {
    const strapi = createBootstrapStrapi({}, { cronEnabled: true })

    await bootstrap({ strapi })

    expect(strapi.cron.add).not.toHaveBeenCalled()
  })

  test('destroy removes the retry job', () => {
    const strapi = createBootstrapStrapi(enabled, { cronEnabled: true })

    destroy({ strapi })

    expect(strapi.cron.remove).toHaveBeenCalledWith(
      'meilisearch-retry-failed-sync',
    )
  })
})
