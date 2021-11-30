

- It is not clear that the documentation is for v4: https://docs-next.strapi.io/developer-docs/latest/developer-resources/plugin-api-reference/admin-panel.html#register

## SERVER

- Documentation of `strapi-server.js` differs from the article and the documentation here: https://docs-next.strapi.io/developer-docs/latest/developer-resources/plugin-api-reference/server.html#controllers . Here it says that strapi-server outputs a function, which is not the case, it outputs an object

- Can the controller access the strapi global?
```js
// path: ./controllers/controller-a.js

module.exports = {
  doSomething(ctx) {
    ctx.body = { message: 'HelloWorld' };
  },
};

 ```

- Not clear what is inside the `strapi` global as console log only returns fields that where not binded through `createObject`. Thus `contentType` does not appear.

- `strapi.contentTypes` is not documented (sorry if it is and that I did not see it). I wonder which other fields exists on that global that are not outputed by logging

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

- Article
- Link in add menu link is not showed inside a link tag


## Admin

- using `strapi generate plugin`,
  - it generates both containers and pages with almost the same content
  - Had to delete the pages folder

- Can not make my plugin name sexy in `/admin/list-plugins`
- register plugin documentation is missing the parameters it requires.  The returned object is written in the documentation,
  - If this is a type these parameters are missing: `isReady` key and the `initializerkey` in the documentation: https://docs-next.strapi.io/developer-docs/latest/developer-resources/plugin-api-reference/admin-panel.html#register
- Not able apparently to link `strapi-admin` with my `admin` folder


## Misc
- `.env` file in playground automatically adds tokens
