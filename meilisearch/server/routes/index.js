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
    path: '/content-type',
    handler: 'contentTypeController.getContentTypes',
    config: {},
  },
  {
    method: 'POST',
    path: '/content-type',
    handler: 'contentTypeController.addContentType',
    config: {},
  },
  {
    method: 'PUT',
    path: '/content-type',
    handler: 'contentTypeController.updateContentType',
    config: {},
  },
  {
    method: 'DELETE',
    path: '/content-type/:contentType',
    handler: 'contentTypeController.removeContentType',
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
