import createLifecycle from '../services/lifecycle/lifecycle.js'
import {MeiliSearch} from '../__mocks__/meilisearch'
import {createStrapiMock} from "../__mocks__/strapi"

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
  entriesQuery: jest.fn(() => ({}))
}

const storeService = {
  addListenedContentType: jest.fn(() => ({}))
}

const contentTypeService = {
  getContentTypeUid: ({ contentType }) => contentType,
  getEntry: jest.fn()
}

// Create a mock of the plugin service function
const originalPlugin = strapiMock.plugin
strapiMock.plugin = jest.fn((pluginName) => {
  if (pluginName === 'meilisearch') {
    return {
      service: jest.fn((serviceName) => {
        if (serviceName === 'store') return storeService
        if (serviceName === 'meilisearch') return meilisearchService
        if (serviceName === 'contentType') return contentTypeService
        return originalPlugin().service()
      })
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
        meilisearchService.addEntriesToMeilisearch.mockClear().mockReturnValue(Promise.resolve());
        meilisearchService.updateEntriesInMeilisearch.mockClear().mockReturnValue(Promise.resolve());
        meilisearchService.deleteEntriesFromMeiliSearch.mockClear().mockReturnValue(Promise.resolve());
        
        contentTypeService.getEntries = jest.fn().mockResolvedValue([{ id: '1', title: 'Test' }]);
        contentTypeService.numberOfEntries = jest.fn().mockResolvedValue(5);
        
        lifecycleHandler = createLifecycle({ strapi: strapiMock })
    })

    test('should add entry to Meilisearch on afterCreate', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const result = { id: '123', title: 'Test Entry' };

        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({ result });

        expect(meilisearchService.addEntriesToMeilisearch).toHaveBeenCalledWith({
            contentType: contentTypeUid,
            entries: [result]
        });
        expect(storeService.addListenedContentType).toHaveBeenCalledWith({
            contentType: contentTypeUid
        });
    });

    test('should handle error during afterCreate', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const result = { id: '123', title: 'Test Entry' };
        const error = new Error('Connection failed');

        // Mock error scenario
        meilisearchService.addEntriesToMeilisearch.mockRejectedValueOnce(error);
        jest.spyOn(strapiMock.log, 'error');

        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({ result });

        expect(strapiMock.log.error).toHaveBeenCalledWith(
            `Meilisearch could not add entry with id: ${result.id}: ${error.message}`
        );
    });

    test('should process multiple entries on afterCreateMany', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const result = { 
            count: 3, 
            ids: ['1', '2', '3'] 
        };
        
        const mockEntries = [
            { id: '1', title: 'Entry 1' },
            { id: '2', title: 'Entry 2' },
            { id: '3', title: 'Entry 3' }
        ];
        
        contentTypeService.getEntries.mockResolvedValueOnce(mockEntries);
        
        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreateMany({ result });
        
        expect(contentTypeService.getEntries).toHaveBeenCalledWith({
            contentType: contentTypeUid,
            start: 0,
            limit: 500,
            filters: {
                id: {
                    $in: result.ids
                }
            }
        });
        
        expect(meilisearchService.updateEntriesInMeilisearch).toHaveBeenCalledWith({
            contentType: contentTypeUid,
            entries: mockEntries
        });
    });
    
    test('should handle error during afterCreateMany', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const result = { 
            count: 3, 
            ids: ['1', '2', '3'] 
        };
        
        const mockEntries = [
            { id: '1', title: 'Entry 1' },
            { id: '2', title: 'Entry 2' },
            { id: '3', title: 'Entry 3' }
        ];
        
        // Setup the mock to return entries but fail on updateEntriesInMeilisearch
        contentTypeService.getEntries.mockResolvedValueOnce(mockEntries);
        const error = new Error('Batch update failed');
        meilisearchService.updateEntriesInMeilisearch.mockRejectedValueOnce(error);
        
        jest.spyOn(strapiMock.log, 'error');
        
        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreateMany({ result });
        
        expect(strapiMock.log.error).toHaveBeenCalledWith(
            `Meilisearch could not update the entries: ${error.message}`
        );
    });

    test('should update entry in Meilisearch on afterUpdate', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const result = { id: '123', title: 'Updated Entry' };

        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdate({ result });

        expect(meilisearchService.updateEntriesInMeilisearch).toHaveBeenCalledWith({
            contentType: contentTypeUid,
            entries: [result]
        });
    });
    
    test('should handle error during afterUpdate', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const result = { id: '123', title: 'Updated Entry' };
        const error = new Error('Update failed');

        meilisearchService.updateEntriesInMeilisearch.mockRejectedValueOnce(error);
        jest.spyOn(strapiMock.log, 'error');

        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdate({ result });

        expect(strapiMock.log.error).toHaveBeenCalledWith(
            `Meilisearch could not update entry with id: ${result.id}: ${error.message}`
        );
    });
    
    test('should process multiple entries on afterUpdateMany', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const event = {
            params: {
                where: { type: 'restaurant' }
            }
        };
        
        const mockEntries = [
            { id: '1', title: 'Updated 1' },
            { id: '2', title: 'Updated 2' }
        ];
        
        contentTypeService.getEntries.mockResolvedValueOnce(mockEntries);
        
        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdateMany(event);
        
        expect(contentTypeService.numberOfEntries).toHaveBeenCalledWith({
            contentType: contentTypeUid,
            filters: event.params.where
        });
        
        expect(contentTypeService.getEntries).toHaveBeenCalledWith({
            contentType: contentTypeUid,
            filters: event.params.where,
            start: 0,
            limit: 500
        });
        
        expect(meilisearchService.updateEntriesInMeilisearch).toHaveBeenCalledWith({
            contentType: contentTypeUid,
            entries: mockEntries
        });
    });
    
    test('should handle error during afterUpdateMany', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const event = {
            params: {
                where: { type: 'restaurant' }
            }
        };
        
        const mockEntries = [
            { id: '1', title: 'Updated 1' },
            { id: '2', title: 'Updated 2' }
        ];
        
        // Setup mocks for the success path but failure during Meilisearch update
        contentTypeService.getEntries.mockResolvedValueOnce(mockEntries);
        const error = new Error('Batch update failed');
        meilisearchService.updateEntriesInMeilisearch.mockRejectedValueOnce(error);
        
        jest.spyOn(strapiMock.log, 'error');
        
        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterUpdateMany(event);
        
        expect(strapiMock.log.error).toHaveBeenCalledWith(
            `Meilisearch could not update the entries: ${error.message}`
        );
    });

    test('should delete entry from Meilisearch on afterDelete', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const result = { id: '123' };

        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterDelete({ result });

        expect(meilisearchService.deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
            contentType: contentTypeUid,
            entriesId: [result.id]
        });
    });
    
    test('should handle multiple ids in afterDelete', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const result = { id: '123' };
        const params = {
            where: {
                $and: [
                    { id: { $in: ['101', '102', '103'] } }
                ]
            }
        };

        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterDelete({ result, params });

        expect(meilisearchService.deleteEntriesFromMeiliSearch).toHaveBeenCalledWith({
            contentType: contentTypeUid,
            entriesId: ['101', '102', '103']
        });
    });
    
    test('should handle error during afterDelete', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const result = { id: '123' };
        const error = new Error('Delete failed');

        meilisearchService.deleteEntriesFromMeiliSearch.mockRejectedValueOnce(error);
        jest.spyOn(strapiMock.log, 'error');

        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterDelete({ result });

        expect(strapiMock.log.error).toHaveBeenCalledWith(
            `Meilisearch could not delete entry with id: ${result.id}: ${error.message}`
        );
    });
    
    test('should call afterDelete from afterDeleteMany', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';
        const event = { result: { id: '123' } };

        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });
        
        // Get a reference to the afterDelete handler
        const afterDeleteSpy = jest.spyOn(
            strapiMock.db.lifecycles.subscribe.mock.calls[0][0], 
            'afterDelete'
        );
        
        // Call afterDeleteMany
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterDeleteMany(event);
        
        // Verify it calls afterDelete with the same event
        expect(afterDeleteSpy).toHaveBeenCalledWith(event);
    });
})
