

## v4
- It is not clear that the documentation is for v4: https://docs-next.strapi.io/developer-docs/latest/developer-resources/plugin-api-reference/admin-panel.html#register

## SERVER

### Contradictions
- Documentation of `strapi-server.js` differs from the article and the documentation here: https://docs-next.strapi.io/developer-docs/latest/developer-resources/plugin-api-reference/server.html#controllers . Here it says that strapi-server outputs a function, which is not the case, it outputs an object

### Unknown
- Can the controller access the strapi global?
```js
// path: ./controllers/controller-a.js

module.exports = {
  doSomething(ctx) {
    ctx.body = { message: 'HelloWorld' };
  },
};

 ```

#### Clarity
- Not clear what is inside the `strapi` global as console log only returns fields that where not binded through `createObject`. Thus `contentType` does not appear.
```js
console.log(Object.keys(strapi))
// ==>
[
  'dirs',            'container',
  'isLoaded',        'reload',
  'server',          'fs',
  'eventHub',        'startupLogger',
  'log',             'cron',
  'telemetry',       'admin',
  'app',             'components',
  'webhookRunner',   'db',
  'store',           'webhookStore',
  'entityValidator', 'entityService'
]
```
For example `strapi.contentTypes` is not documented (sorry if it is and that I did not see it). I wonder which other fields exists on that global that are not outputed by logging

### Hard to find:
The following are very important but are hidden in a `spoiler` tag inside the documentation: https://docs-next.strapi.io/developer-docs/latest/developer-resources/plugin-api-reference/server.html#usage
```js
// STRAPI GLOBAL
strapi.plugin('plugin-name').config
strapi.plugin('plugin-name').routes
strapi.plugin('plugin-name').controller('controller-name')
strapi.plugin('plugin-name').service('service-name')
strapi.plugin('plugin-name').contentType('content-type-name')
strapi.plugin('plugin-name').policy('policy-name')
strapi.plugin('plugin-name').middleware('middleware-name')
```

## Article content
- Link in add menu link is not showed inside a link tag
- no example of the controller file which is expected to return an object and not a function thus im not sure we can access the strapi global


## Admin

- using `strapi generate plugin`,
  - it generates both containers and pages with almost the same content
  - Had to delete the pages folder
  - Should be mentioned in the doc that it is outdated as it was hard to clean

- How to make my plugin name sexy in `/admin/list-plugins`

### Missing
- register plugin documentation is missing the parameters it requires.  The returned object is written in the documentation,
  - If this is a type these parameters are missing: `isReady` key and the `initializerkey` in the documentation: https://docs-next.strapi.io/developer-docs/latest/developer-resources/plugin-api-reference/admin-panel.html#register

## Misc
- `.env` file in playground automatically adds tokens. Wonder why
