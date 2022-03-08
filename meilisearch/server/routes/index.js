module.exports = [
  {
    method: 'GET',
    path: '/credential',
    handler: 'credentialController.getCredentials',
    config: {},
  },
  {
    method: 'POST',
    path: '/credential',
    handler: 'credentialController.addCredentials',
    config: {},
  },
  {
    method: 'GET',
    path: '/collection',
    handler: 'collectionController.getCollections',
    config: {},
  },
  {
    method: 'POST',
    path: '/collection',
    handler: 'collectionController.addCollection',
    config: {},
  },
  {
    method: 'PUT',
    path: '/collection/:collection',
    handler: 'collectionController.updateCollection',
    config: {},
  },
  {
    method: 'DELETE',
    path: '/collection/:collection',
    handler: 'collectionController.removeCollection',
    config: {},
  },
  {
    method: 'POST',
    path: '/meilisearch/wait-for-tasks',
    handler: 'meilisearchController.waitForTasks',
    config: {},
  },
  {
    method: 'GET',
    path: '/meilisearch/enqueued-tasks',
    handler: 'meilisearchController.getEnqueuedTaskUids',
    config: {},
  },
  {
    method: 'GET',
    path: '/reload',
    handler: 'reloadController.reload',
    config: {},
  },
]
