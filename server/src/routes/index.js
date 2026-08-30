import { ACTIONS } from '../constants'

export default [
  {
    method: 'GET',
    path: '/credential',
    handler: 'credentialController.getCredentials',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/credential',
    handler: 'credentialController.addCredentials',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: { actions: [ACTIONS.settings] },
        },
      ],
    },
  },
  {
    method: 'GET',
    path: '/content-type',
    handler: 'contentTypeController.getContentTypes',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/content-type',
    handler: 'contentTypeController.addContentType',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: { actions: [ACTIONS.create] },
        },
      ],
    },
  },
  {
    method: 'PUT',
    path: '/content-type',
    handler: 'contentTypeController.updateContentType',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: {
            actions: [ACTIONS.update],
          },
        },
      ],
    },
  },
  {
    method: 'DELETE',
    path: '/content-type/:contentType',
    handler: 'contentTypeController.removeContentType',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: {
            actions: [ACTIONS.delete],
          },
        },
      ],
    },
  },
  {
    method: 'GET',
    path: '/content-type-fields/:contentTypeName',
    handler: 'contentTypeController.getContentTypeFields',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: {
            actions: [ACTIONS.read],
          },
        }
      ],
    },
  },
  {
    method: 'GET',
    path: '/filterable-attributes/:indexUid',
    handler: 'contentTypeController.getFilterableAttributes',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/filterable-attributes/:indexUid',
    handler: 'contentTypeController.updateFilterableAttributes',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          config: {
            actions: [ACTIONS.update],
          },
        }
      ]
    },
  },
  {
    method: 'GET',
    path: '/reload',
    handler: 'reloadController.reload',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
]
