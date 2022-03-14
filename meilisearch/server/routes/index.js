module.exports = [
  {
    method: 'GET',
    path: '/credential',
    handler: 'credentialController.getCredentials',
    config: {
      policies: ['isAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/credential',
    handler: 'credentialController.addCredentials',
    config: {
      policies: ['isAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/content-type',
    handler: 'contentTypeController.getContentTypes',
    config: {
      policies: ['isAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/content-type',
    handler: 'contentTypeController.addContentType',
    config: {
      policies: ['isAdmin'],
    },
  },
  {
    method: 'PUT',
    path: '/content-type',
    handler: 'contentTypeController.updateContentType',
    config: {
      policies: ['isAdmin'],
    },
  },
  {
    method: 'DELETE',
    path: '/content-type/:contentType',
    handler: 'contentTypeController.removeContentType',
    config: {
      policies: ['isAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/meilisearch/wait-for-tasks',
    handler: 'meilisearchController.waitForTasks',
    config: {
      policies: ['isAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/meilisearch/enqueued-tasks',
    handler: 'meilisearchController.getEnqueuedTaskUids',
    config: {
      policies: ['isAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/reload',
    handler: 'reloadController.reload',
    config: {
      policies: ['isAdmin'],
    },
  },
]
