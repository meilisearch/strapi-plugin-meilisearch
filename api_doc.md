- Content Types
- Database
- Services
- Store


## CONTENT TYPES

List of content types

Sometimes this work:
```js
strapi.contentTypes
```

If it doesnt this should work
```js
strapi.db.query('content-types:list')
```

```
strapi.api.restaurant
```

```js
{
  bootstrap: [AsyncFunction: bootstrap],
  register: [AsyncFunction: register],
  destroy: [AsyncFunction: destroy],
  load: [Function: load],
  routes: [Getter],
  config: [Function: config],
  contentType: [Function: contentType], // returns undefined
  contentTypes: [Getter],
  service: [Function: service], // returns undefined
  services: [Getter],
  policy: [Function: policy],
  policies: [Getter],
  middleware: [Function: middleware],
  middlewares: [Getter],
  controller: [Function: controller],
  controllers: [Getter]
}
```


```js
strapi.api.restaurant.contentTypes
```
```js
{
  restaurant: {
    kind: 'collectionType',
    collectionName: 'restaurants',
    info: {
      singularName: 'restaurant',
      pluralName: 'restaurants',
      displayName: 'restaurant'
    },
    options: { draftAndPublish: false },
    pluginOptions: {},
    attributes: {
      title: [Object],
      description: [Object],
      createdAt: [Object],
      updatedAt: [Object],
      createdBy: [Object],
      updatedBy: [Object]
    },
    __schema__: {
      collectionName: 'restaurants',
      info: [Object],
      options: [Object],
      pluginOptions: {},
      attributes: [Object],
      kind: 'collectionType'
    },
    modelType: 'contentType',
    modelName: 'restaurant',
    connection: 'default',
    uid: 'api::restaurant.restaurant',
    apiName: 'restaurant',
    globalId: 'Restaurant',
    actions: {},
    lifecycles: {}
  }
}
```

Find many of a collection
```js
const response = await strapi.db
  .query('plugin::users-permissions.user')
  .findMany({})
```

## Services
```js
strapi.api.restaurant.services
```

```js
{
  restaurant: {
    find: [AsyncFunction: find],
    findOne: [Function: findOne],
    create: [Function: create],
    update: [Function: update],
    delete: [Function: delete]
  }
}
```

```js
await strapi.api.restaurant.services.restaurant.find()
```

```js
{
  results: [
    {
      id: 1,
      title: 'HEY',
      description: 'HO',
      createdAt: '2021-11-30T21:28:11.790Z',
      updatedAt: '2021-11-30T21:28:11.790Z'
    }
  ],
  pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 }
}
```

Accessing service in plugin
```js
strapi
  .plugin('meilisearch')
  .service('contentTypes')
  .transformEntries({ collection: 'restaurant' })
```

or in api and plugin

```js
console.log(strapi.service('api::restaurant.restaurant')).myFunction
console.log(strapi.service('plugin::meilisearch.store'))
```

or
```js
console.log(await strapi.api.restaurant.services.restaurant.find())
console.log(await strapi.entityService.count('api::restaurant.restaurant'))
console.log(await strapi.db.query('api::restaurant.restaurant').count())
```

## Working with the database:

```js
  await strapi.entityService.count('api::restaurant.restaurant')
  await strapi.db.query('api::restaurant.restaurant').count()
```

## Store

```js
console.log(strapi.service('plugin::meilisearch.store'))
```

## Config

```js
  const meilisearchConfig = strapi.config.get('plugin.meilisearch')
```


## Get user list
```js
// FIXME: Ignored until a elegant solution is found to index users
// That does not involve if`s everywhere
function isUserPermissionEnabled(strapi) {
  return Object.keys(strapi.contentTypes).includes(
    'plugin::users-permissions.user'
  )
}
```




## Get API configurations

```js
const conf =
        strapi?.api[collection]?.services[collection]?.meilisearch || {}
```

Documentation :  https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-templates-generate

```
strapi --template corporate
```
