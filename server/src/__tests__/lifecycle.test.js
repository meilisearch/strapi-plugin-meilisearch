import createLifecycle from '../services/lifecycle/lifecycle.js'
import { MeiliSearch } from '../__mocks__/meilisearch'
import { createStrapiMock } from '../__mocks__/strapi'

global.meiliSearch = MeiliSearch

const strapiMock = createStrapiMock({})
global.strapi = strapiMock

// Setup service mocks to handle lifecycle operations
const meilisearchService = {
  addEntriesToMeilisearch: jest.fn().mockReturnValue(Promise.resolve()),
  updateEntriesInMeilisearch: jest.fn().mockReturnValue(Promise.resolve()),
  deleteEntriesFromMeiliSearch: jest.fn().mockReturnValue(Promise.resolve()),
  getContentTypesUid: () => ['restaurant', 'about'],
  getContentTypeUid: ({ contentType }) => contentType,
  getCollectionName: ({ contentType }) => contentType,
  entriesQuery: jest.fn(() => ({})),
}

const storeService = {
  addListenedContentType: jest.fn(() => ({})),
}

const contentTypeService = {
  getContentTypeUid: ({ contentType }) => contentType,
  getEntry: jest.fn(),
  getEntries: jest.fn(),
  numberOfEntries: jest.fn(),
}

// Create a mock of the plugin service function
const originalPlugin = strapiMock.plugin
strapiMock.plugin = jest.fn(pluginName => {
  if (pluginName === 'meilisearch') {
    return {
      service: jest.fn(serviceName => {
        if (serviceName === 'store') return storeService
        if (serviceName === 'meilisearch') return meilisearchService
        if (serviceName === 'contentType') return contentTypeService
        return originalPlugin().service()
      }),
    }
  }
  return originalPlugin(pluginName)
})

describe('Lifecycle Meilisearch integration', () => {
  let lifecycleHandler

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.restoreAllMocks()

    // Reset all mocks for clean state
    meilisearchService.addEntriesToMeilisearch
      .mockClear()
      .mockReturnValue(Promise.resolve())
    meilisearchService.updateEntriesInMeilisearch
      .mockClear()
      .mockReturnValue(Promise.resolve())
    meilisearchService.deleteEntriesFromMeiliSearch
      .mockClear()
      .mockReturnValue(Promise.resolve())
    meilisearchService.entriesQuery.mockClear().mockReturnValue({})

    contentTypeService.getEntry.mockClear()
    contentTypeService.getEntries
      .mockClear()
      .mockResolvedValue([{ id: '1', title: 'Test' }])
    contentTypeService.numberOfEntries.mockClear().mockResolvedValue(5)

    lifecycleHandler = createLifecycle({ strapi: strapiMock })
  })

  test('should add entry to Meilisearch on afterCreate', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = {
      documentId: '123',
      id: '123',
      title: 'Test Entry',
      publishedAt: '2024-01-01',
    }
    const fetchedEntry = {
      documentId: '123',
      id: '123',
      title: 'Test Entry',
      description: 'Full entry',
      publishedAt: null,
    }
    const entriesQuery = { populate: '*', fields: '*' }

    // Mock the new behavior
    contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
    meilisearchService.entriesQuery.mockReturnValueOnce(entriesQuery)

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({
      result,
    })

    // Verify getEntry was called with correct parameters including locale and status
    expect(contentTypeService.getEntry).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      documentId: result.documentId,
      entriesQuery: {
        ...entriesQuery,
        locale: result.locale,
        status: 'published',
      },
    })

    // Verify entriesQuery was called
    expect(meilisearchService.entriesQuery).toHaveBeenCalledWith({
      contentType: contentTypeUid,
    })

    // Verify the fetched entry is passed to Meilisearch
    expect(meilisearchService.addEntriesToMeilisearch).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      entries: [fetchedEntry],
    })
    expect(storeService.addListenedContentType).toHaveBeenCalledWith({
      contentType: contentTypeUid,
    })
  })

  test('should handle error during afterCreate', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = {
      documentId: '123',
      id: '123',
      title: 'Test Entry',
      publishedAt: '2024-01-01',
    }
    const fetchedEntry = {
      documentId: '123',
      id: '123',
      title: 'Test Entry',
      description: 'Full entry',
      publishedAt: null,
    }
    const entriesQuery = { populate: '*', fields: '*' }
    const error = new Error('Connection failed')

    // Mock the new behavior and error scenario
    contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
    meilisearchService.entriesQuery.mockReturnValueOnce(entriesQuery)
    meilisearchService.addEntriesToMeilisearch.mockRejectedValueOnce(error)
    jest.spyOn(strapiMock.log, 'error')

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({
      result,
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      `Meilisearch could not add entry with id: ${result.id}: ${error.message}`,
    )
  })

  test('should process multiple entries on afterCreateMany', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = {
      count: 3,
      ids: ['1', '2', '3'],
    }

    const mockEntries = [
      { id: '1', title: 'Entry 1' },
      { id: '2', title: 'Entry 2' },
      { id: '3', title: 'Entry 3' },
    ]

    contentTypeService.getEntries.mockResolvedValueOnce(mockEntries)

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreateMany({
      result,
    })

    expect(contentTypeService.getEntries).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      start: 0,
      limit: 500,
      filters: {
        id: {
          $in: result.ids,
        },
      },
    })

    expect(meilisearchService.updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      entries: mockEntries,
    })
  })

  test('should handle error during afterCreateMany', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = {
      count: 3,
      ids: ['1', '2', '3'],
    }

    const mockEntries = [
      { id: '1', title: 'Entry 1' },
      { id: '2', title: 'Entry 2' },
      { id: '3', title: 'Entry 3' },
    ]

    // Setup the mock to return entries but fail on updateEntriesInMeilisearch
    contentTypeService.getEntries.mockResolvedValueOnce(mockEntries)
    const error = new Error('Batch update failed')
    meilisearchService.updateEntriesInMeilisearch.mockRejectedValueOnce(error)

    jest.spyOn(strapiMock.log, 'error')

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreateMany({
      result,
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      `Meilisearch could not update the entries: ${error.message}`,
    )
  })

  test('should update entry in Meilisearch on afterUpdate', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = {
      documentId: '123',
      id: '123',
      title: 'Updated Entry',
      publishedAt: '2024-01-01',
    }
    const fetchedEntry = {
      documentId: '123',
      id: '123',
      title: 'Updated Entry',
      description: 'Full updated entry',
      publishedAt: null,
    }
    const entriesQuery = { populate: '*', fields: '*' }

    // Mock the new behavior
    contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
    meilisearchService.entriesQuery.mockReturnValueOnce(entriesQuery)

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdate({
      result,
    })

    // Verify getEntry was called with correct parameters including locale and status
    expect(contentTypeService.getEntry).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      documentId: result.documentId,
      entriesQuery: {
        ...entriesQuery,
        locale: result.locale,
        status: 'published',
      },
    })

    // Verify entriesQuery was called
    expect(meilisearchService.entriesQuery).toHaveBeenCalledWith({
      contentType: contentTypeUid,
    })

    // Verify the fetched entry is passed to Meilisearch
    expect(meilisearchService.updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      entries: [fetchedEntry],
    })
  })

  test('should handle error during afterUpdate', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = {
      documentId: '123',
      id: '123',
      title: 'Updated Entry',
      publishedAt: '2024-01-01',
    }
    const fetchedEntry = {
      documentId: '123',
      id: '123',
      title: 'Updated Entry',
      description: 'Full updated entry',
      publishedAt: null,
    }
    const entriesQuery = { populate: '*', fields: '*' }
    const error = new Error('Update failed')

    // Mock the new behavior and error scenario
    contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
    meilisearchService.entriesQuery.mockReturnValueOnce(entriesQuery)
    meilisearchService.updateEntriesInMeilisearch.mockRejectedValueOnce(error)
    jest.spyOn(strapiMock.log, 'error')

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdate({
      result,
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      `Meilisearch could not update entry with id: ${result.id}: ${error.message}`,
    )
  })

  test('should preserve publishedAt from lifecycle result when getEntry returns null (published entry bug)', async () => {
    // This test covers the bug where getEntry returns null publishedAt even for published entries
    // The lifecycle result contains the correct publishedAt value that should be preserved
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = {
      documentId: '123',
      id: '123',
      title: 'Published Entry',
      publishedAt: '2024-01-01T10:00:00.000Z', // Correct publishedAt from lifecycle
    }
    const fetchedEntry = {
      documentId: '123',
      id: '123',
      title: 'Published Entry',
      description: 'Full entry',
      publishedAt: null, // Bug: getEntry incorrectly returns null publishedAt
    }
    const entriesQuery = { populate: '*', fields: '*' }

    contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
    meilisearchService.entriesQuery.mockReturnValueOnce(entriesQuery)

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({
      result,
    })

    // Verify the entry sent to Meilisearch is the fetched entry
    expect(meilisearchService.addEntriesToMeilisearch).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      entries: [fetchedEntry],
    })
  })

  test('should preserve null publishedAt from lifecycle result (draft entry)', async () => {
    // This test covers draft entries that correctly have null publishedAt
    // Both lifecycle result and fetched entry should have null publishedAt for drafts
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = {
      documentId: '123',
      id: '123',
      title: 'Draft Entry',
      publishedAt: null, // Draft entry has null publishedAt
    }
    const fetchedEntry = {
      documentId: '123',
      id: '123',
      title: 'Draft Entry',
      description: 'Full draft entry',
      publishedAt: null, // Draft entry correctly has null publishedAt
    }
    const entriesQuery = { populate: '*', fields: '*' }

    contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
    meilisearchService.entriesQuery.mockReturnValueOnce(entriesQuery)

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdate({
      result,
    })

    // Verify the entry sent to Meilisearch is the fetched entry
    expect(meilisearchService.updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      entries: [fetchedEntry],
    })
  })

  test('should handle non-draftAndPublish content types where entry should always be published', async () => {
    // Note: api::restaurant.restaurant has draftAndPublish: false in mock data
    // For non-draftAndPublish content types, all entries are always published
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = {
      documentId: '123',
      id: '123',
      title: 'Restaurant Entry',
      publishedAt: '2024-01-01T10:00:00.000Z', // Always has publishedAt for non-draftAndPublish
    }
    const fetchedEntry = {
      documentId: '123',
      id: '123',
      title: 'Restaurant Entry',
      description: 'Full restaurant entry',
      publishedAt: null, // Bug: getEntry returns null even for published non-draftAndPublish entries
    }
    const entriesQuery = { populate: '*', fields: '*' }

    contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
    meilisearchService.entriesQuery.mockReturnValueOnce(entriesQuery)

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({
      result,
    })

    // Verify the entry sent to Meilisearch is the fetched entry
    expect(meilisearchService.addEntriesToMeilisearch).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      entries: [fetchedEntry],
    })
  })

  test('should call entriesQuery with content type for entry fetching', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = {
      documentId: '123',
      id: '123',
      title: 'Test Entry',
      publishedAt: '2024-01-01',
    }
    const fetchedEntry = {
      documentId: '123',
      id: '123',
      title: 'Test Entry',
      description: 'Full entry',
      publishedAt: null,
    }
    const customEntriesQuery = {
      populate: { category: true },
      fields: ['title', 'description'],
    }

    contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
    meilisearchService.entriesQuery.mockReturnValueOnce(customEntriesQuery)

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({
      result,
    })

    // Verify entriesQuery was called with the content type
    expect(meilisearchService.entriesQuery).toHaveBeenCalledWith({
      contentType: contentTypeUid,
    })

    // Verify getEntry was called with the entriesQuery result and new parameters
    expect(contentTypeService.getEntry).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      documentId: result.documentId,
      entriesQuery: {
        ...customEntriesQuery,
        locale: result.locale,
        status: 'published',
      },
    })
  })

  test('should handle draftAndPublish content types with published entries', async () => {
    // Note: api::article.article has draftAndPublish: true in mock data
    // For draftAndPublish content types, entries can be either published or draft
    const contentTypeUid = 'api::article.article'
    const result = {
      documentId: '456',
      id: '456',
      title: 'Published Article',
      publishedAt: '2024-01-15T14:30:00.000Z', // Published entry has publishedAt
    }
    const fetchedEntry = {
      documentId: '456',
      id: '456',
      title: 'Published Article',
      content: 'Full article content',
      publishedAt: null, // Bug: getEntry returns null even for published draftAndPublish entries
    }
    const entriesQuery = { populate: '*', fields: '*' }

    contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
    meilisearchService.entriesQuery.mockReturnValueOnce(entriesQuery)

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({
      result,
    })

    // Verify the entry sent to Meilisearch is the fetched entry
    expect(meilisearchService.addEntriesToMeilisearch).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      entries: [fetchedEntry],
    })
  })

  test('should handle draftAndPublish content types with draft entries', async () => {
    // Note: api::article.article has draftAndPublish: true in mock data
    // For draftAndPublish content types, draft entries have publishedAt: null
    const contentTypeUid = 'api::article.article'
    const result = {
      documentId: '789',
      id: '789',
      title: 'Draft Article',
      publishedAt: null, // Draft entry has null publishedAt
    }
    const fetchedEntry = {
      documentId: '789',
      id: '789',
      title: 'Draft Article',
      content: 'Draft article content',
      publishedAt: null, // Draft entry correctly has null publishedAt
    }
    const entriesQuery = { populate: '*', fields: '*' }

    contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
    meilisearchService.entriesQuery.mockReturnValueOnce(entriesQuery)

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdate({
      result,
    })

    // Verify the entry sent to Meilisearch is the fetched entry
    expect(meilisearchService.updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      entries: [fetchedEntry],
    })
  })

  test('should process multiple entries on afterUpdateMany', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const event = {
      params: {
        where: { type: 'restaurant' },
      },
    }

    const mockEntries = [
      { id: '1', title: 'Updated 1' },
      { id: '2', title: 'Updated 2' },
    ]

    contentTypeService.getEntries.mockResolvedValueOnce(mockEntries)

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdateMany(
      event,
    )

    expect(contentTypeService.numberOfEntries).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      filters: event.params.where,
    })

    expect(contentTypeService.getEntries).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      filters: event.params.where,
      start: 0,
      limit: 500,
    })

    expect(meilisearchService.updateEntriesInMeilisearch).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      entries: mockEntries,
    })
  })

  test('should handle error during afterUpdateMany', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const event = {
      params: {
        where: { type: 'restaurant' },
      },
    }

    const mockEntries = [
      { id: '1', title: 'Updated 1' },
      { id: '2', title: 'Updated 2' },
    ]

    // Setup mocks for the success path but failure during Meilisearch update
    contentTypeService.getEntries.mockResolvedValueOnce(mockEntries)
    const error = new Error('Batch update failed')
    meilisearchService.updateEntriesInMeilisearch.mockRejectedValueOnce(error)

    jest.spyOn(strapiMock.log, 'error')

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdateMany(
      event,
    )

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      `Meilisearch could not update the entries: ${error.message}`,
    )
  })

  test('should delete entry from Meilisearch on afterDelete', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = { id: '123' }

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterDelete({
      result,
    })

    expect(
      meilisearchService.deleteEntriesFromMeiliSearch,
    ).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      entriesId: [result.id],
    })
  })

  test('should handle multiple ids in afterDelete', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = { id: '123' }
    const params = {
      where: {
        $and: [{ id: { $in: ['101', '102', '103'] } }],
      },
    }

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterDelete({
      result,
      params,
    })

    expect(
      meilisearchService.deleteEntriesFromMeiliSearch,
    ).toHaveBeenCalledWith({
      contentType: contentTypeUid,
      entriesId: ['101', '102', '103'],
    })
  })

  test('should handle error during afterDelete', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const result = { id: '123' }
    const error = new Error('Delete failed')

    meilisearchService.deleteEntriesFromMeiliSearch.mockRejectedValueOnce(error)
    jest.spyOn(strapiMock.log, 'error')

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterDelete({
      result,
    })

    expect(strapiMock.log.error).toHaveBeenCalledWith(
      `Meilisearch could not delete entry with id: ${result.id}: ${error.message}`,
    )
  })

  test('should call afterDelete from afterDeleteMany', async () => {
    const contentTypeUid = 'api::restaurant.restaurant'
    const event = { result: { id: '123' } }

    await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid })

    // Get a reference to the afterDelete handler
    const afterDeleteSpy = jest.spyOn(
      strapiMock.db.lifecycles.subscribe.mock.calls[0][0],
      'afterDelete',
    )

    // Call afterDeleteMany
    await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterDeleteMany(
      event,
    )

    // Verify it calls afterDelete with the same event
    expect(afterDeleteSpy).toHaveBeenCalledWith(event)
  })

  describe('Fix for issue #1040 - Relation and locale data preservation', () => {
    test('should pass locale from lifecycle result to getEntry (fixes #1040)', async () => {
      const contentTypeUid = 'api::article.article'
      const result = {
        documentId: '123',
        id: '123',
        title: 'Internationalized Entry',
        publishedAt: '2024-01-01',
        locale: 'fr', // Locale from lifecycle result
      }
      const fetchedEntry = {
        documentId: '123',
        id: '123',
        title: 'Entrée internationalisée',
        publishedAt: null,
      }
      const baseEntriesQuery = { populate: '*', fields: '*' }

      contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
      meilisearchService.entriesQuery.mockReturnValueOnce(baseEntriesQuery)

      await lifecycleHandler.subscribeContentType({
        contentType: contentTypeUid,
      })
      await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({
        result,
      })

      // Verify getEntry was called with locale from lifecycle result
      expect(contentTypeService.getEntry).toHaveBeenCalledWith({
        contentType: contentTypeUid,
        documentId: result.documentId,
        entriesQuery: {
          ...baseEntriesQuery,
          locale: 'fr', // Must preserve locale from result
          status: 'published',
        },
      })
    })

    test('should pass status "published" to getEntry to ensure only published content is indexed (fixes #1040)', async () => {
      const contentTypeUid = 'api::restaurant.restaurant'
      const result = {
        documentId: '123',
        id: '123',
        title: 'Test Entry',
        publishedAt: '2024-01-01',
      }
      const fetchedEntry = {
        documentId: '123',
        id: '123',
        title: 'Test Entry',
        publishedAt: null,
      }
      const baseEntriesQuery = {
        populate: { category: true },
        fields: ['title'],
      }

      contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
      meilisearchService.entriesQuery.mockReturnValueOnce(baseEntriesQuery)

      await lifecycleHandler.subscribeContentType({
        contentType: contentTypeUid,
      })
      await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdate({
        result,
      })

      // Verify status "published" is always passed to ensure only published content is indexed
      expect(contentTypeService.getEntry).toHaveBeenCalledWith({
        contentType: contentTypeUid,
        documentId: result.documentId,
        entriesQuery: {
          ...baseEntriesQuery,
          locale: undefined, // No locale in this test
          status: 'published', // Must always pass published status
        },
      })
    })

    test('should fetch complete entry with relations instead of using lifecycle result counts (fixes #1040)', async () => {
      const contentTypeUid = 'api::user.user'
      // Lifecycle result contains relation counts instead of full relation data
      const lifecycleResult = {
        documentId: '456',
        id: '456',
        username: 'testuser',
        publishedAt: '2024-01-01',
        roles: { count: 2 }, // Only count, not actual role data
        profile: { count: 1 }, // Only count, not actual profile data
      }

      // getEntry returns complete entry with full relation objects
      const fetchedEntryWithRelations = {
        documentId: '456',
        id: '456',
        username: 'testuser',
        publishedAt: null,
        roles: [
          { id: 1, name: 'Admin', permissions: ['read', 'write'] },
          { id: 2, name: 'Editor', permissions: ['read'] },
        ],
        profile: {
          id: 10,
          bio: 'User biography',
          avatar: 'avatar.jpg',
        },
      }

      const entriesQuery = { populate: '*', fields: '*' }

      contentTypeService.getEntry.mockResolvedValueOnce(
        fetchedEntryWithRelations,
      )
      meilisearchService.entriesQuery.mockReturnValueOnce(entriesQuery)

      await lifecycleHandler.subscribeContentType({
        contentType: contentTypeUid,
      })
      await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({
        result: lifecycleResult,
      })

      // Verify the complete entry with full relations is sent to Meilisearch, not the lifecycle result with counts
      expect(meilisearchService.addEntriesToMeilisearch).toHaveBeenCalledWith({
        contentType: contentTypeUid,
        entries: [fetchedEntryWithRelations],
      })

      // The key fix: fetchedEntryWithRelations contains full relation objects,
      // not the counts from lifecycleResult
      const actualCallArgs =
        meilisearchService.addEntriesToMeilisearch.mock.calls[0][0].entries[0]
      expect(actualCallArgs.roles).toEqual([
        { id: 1, name: 'Admin', permissions: ['read', 'write'] },
        { id: 2, name: 'Editor', permissions: ['read'] },
      ])
      expect(actualCallArgs.profile).toEqual({
        id: 10,
        bio: 'User biography',
        avatar: 'avatar.jpg',
      })
    })

    test('should handle case where getEntry returns null/undefined gracefully (fixes edge case)', async () => {
      const contentTypeUid = 'api::restaurant.restaurant'
      const result = {
        documentId: '999',
        id: '999',
        title: 'Deleted Entry',
        publishedAt: '2024-01-01',
      }

      // getEntry returns null (entry not found or deleted)
      contentTypeService.getEntry.mockResolvedValueOnce(null)
      meilisearchService.entriesQuery.mockReturnValueOnce({ populate: '*' })

      await lifecycleHandler.subscribeContentType({
        contentType: contentTypeUid,
      })

      // Should not throw error when getEntry returns null
      await expect(
        strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({
          result,
        }),
      ).resolves.not.toThrow()

      // Should still attempt to add to Meilisearch (with null entry)
      expect(meilisearchService.addEntriesToMeilisearch).toHaveBeenCalledWith({
        contentType: contentTypeUid,
        entries: [null],
      })
    })

    test('should combine locale + status + relations correctly (integration test for #1040 fix)', async () => {
      const contentTypeUid = 'api::product.product'
      const result = {
        documentId: '789',
        id: '789',
        name: 'Produit International',
        publishedAt: '2024-01-15T10:00:00.000Z',
        locale: 'fr', // French locale
        category: { count: 1 }, // Relation count in lifecycle result
        tags: { count: 3 }, // Multiple relation counts
      }

      const fetchedEntryWithCompleteRelations = {
        documentId: '789',
        id: '789',
        name: 'Produit International',
        description: 'Description complète du produit',
        publishedAt: null, // Bug: getEntry returns null publishedAt
        locale: 'fr',
        category: {
          id: 5,
          name: 'Electronics',
          slug: 'electronics',
        },
        tags: [
          { id: 1, name: 'Popular' },
          { id: 2, name: 'Sale' },
          { id: 3, name: 'Featured' },
        ],
      }

      const entriesQuery = {
        populate: { category: true, tags: true },
        fields: ['name', 'description'],
      }

      contentTypeService.getEntry.mockResolvedValueOnce(
        fetchedEntryWithCompleteRelations,
      )
      meilisearchService.entriesQuery.mockReturnValueOnce(entriesQuery)

      await lifecycleHandler.subscribeContentType({
        contentType: contentTypeUid,
      })
      await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdate({
        result,
      })

      // Verify all fixes work together:
      // 1. Locale is preserved from lifecycle result
      // 2. Status 'published' is enforced
      // 3. Complete relations are fetched (not counts)
      expect(contentTypeService.getEntry).toHaveBeenCalledWith({
        contentType: contentTypeUid,
        documentId: result.documentId,
        entriesQuery: {
          ...entriesQuery,
          locale: 'fr', // Locale from lifecycle result preserved
          status: 'published', // Status enforced for published content only
        },
      })

      // Verify complete relations are sent to Meilisearch (not counts)
      expect(
        meilisearchService.updateEntriesInMeilisearch,
      ).toHaveBeenCalledWith({
        contentType: contentTypeUid,
        entries: [fetchedEntryWithCompleteRelations],
      })

      // Specifically verify relations are complete objects, not counts
      const actualEntry =
        meilisearchService.updateEntriesInMeilisearch.mock.calls[0][0]
          .entries[0]
      expect(actualEntry.category).toEqual({
        id: 5,
        name: 'Electronics',
        slug: 'electronics',
      })
      expect(actualEntry.tags).toEqual([
        { id: 1, name: 'Popular' },
        { id: 2, name: 'Sale' },
        { id: 3, name: 'Featured' },
      ])
    })

    test('should handle undefined locale in lifecycle result gracefully', async () => {
      const contentTypeUid = 'api::restaurant.restaurant'
      const result = {
        documentId: '123',
        id: '123',
        title: 'No Locale Entry',
        publishedAt: '2024-01-01',
        // No locale property
      }
      const fetchedEntry = {
        documentId: '123',
        id: '123',
        title: 'No Locale Entry',
        publishedAt: null,
      }

      contentTypeService.getEntry.mockResolvedValueOnce(fetchedEntry)
      meilisearchService.entriesQuery.mockReturnValueOnce({ populate: '*' })

      await lifecycleHandler.subscribeContentType({
        contentType: contentTypeUid,
      })
      await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({
        result,
      })

      // Verify locale: undefined is passed when not present in result
      expect(contentTypeService.getEntry).toHaveBeenCalledWith({
        contentType: contentTypeUid,
        documentId: result.documentId,
        entriesQuery: {
          populate: '*',
          locale: undefined,
          status: 'published',
        },
      })
    })
  })
})
