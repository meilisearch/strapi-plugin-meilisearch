## Services

To access the services of `api` vs `plugin`

this is how you do it in `plugins` but it does not work with `api`
```js
  strapi
      .plugin('meilisearch')
      .service('contentTypes')
      .transformEntries({ collection: 'restaurant' })
```

As [per the documentation](https://docs.strapi.io/developer-docs/latest/development/backend-customization/services.html#usage) this is how the usage is described for the `api`

MARRCHE PAS
```js
  strapi
      .plugin('restaurant')
      .service('contentTypes')
      .transformEntries({ collection: 'restaurant' })
```

```js
// access an API service
strapi.service('api::apiName.serviceName');
// access a plugin service
strapi.service('plugin::pluginName.serviceName');
```

I'm not sure if it is possible to create consistency between these behaviors.

