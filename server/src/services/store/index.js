import createStoreConnector from './store'
import credential from './credential'
import indexedContentTypes from './indexed-content-types'
import listenedContentTypes from './listened-content-types'
import failedSyncQueue from './failed-sync-queue'

export default ({ strapi }) => {
  const store = createStoreConnector({ strapi })
  return {
    ...credential({ store, strapi }),
    ...listenedContentTypes({ store }),
    ...indexedContentTypes({ store }),
    ...failedSyncQueue({ store }),
    ...createStoreConnector({ strapi }),
  }
}
