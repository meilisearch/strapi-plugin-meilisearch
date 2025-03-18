//import lifecycle from '../services/lifecycle/lifecycle.js'
import createLifecycle from '../services/lifecycle/lifecycle.js'

import {MeiliSearch} from '../__mocks__/meilisearch'
import {createStrapiMock} from "../__mocks__/strapi"

global.meiliSearch = MeiliSearch

const strapiMock = createStrapiMock({})
global.strapi = strapiMock

describe('Lifecycle Meilisearch integration', () => {
    let lifecycleHandler

    beforeEach(async () => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
        lifecycleHandler = createLifecycle({ strapi: strapiMock })
    })

    test('should add entry to Meilisearch on afterCreate', async () => {
        const contentTypeUid = 'api::restaurant.restaurant';

        const result = { id: '123', title: 'Test Entry' };

        // Simuleer de lifecycle subscription
        await lifecycleHandler.subscribeContentType({ contentType: contentTypeUid });

        // Simuleer een afterCreate event
        await strapiMock.db.lifecycles.subscribe.mock.calls[0][0].afterCreate({ result });

        // Controleer of de juiste MeiliSearch-aanroep is gedaan
        expect(strapiMock.plugin().service().addEntriesToMeilisearch).toHaveBeenCalledWith({
            contentType: contentTypeUid,
            entries: [result]
        });
    });

    /*test('should update entry in Meilisearch on afterUpdate', async () => {
        const contentTypeUid = 'test-content-type'
        const result = { id: '123', title: 'Updated Entry' }

        await lifecycleHandler.afterUpdate({ result })

        expect(MeiliSearch.updateEntriesInMeilisearch).toHaveBeenCalledWith({
            contentType: contentTypeUid,
            entries: [result]
        })
    })*/
})
