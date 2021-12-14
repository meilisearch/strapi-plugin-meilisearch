## Obsolete documentation

https://docs-next.strapi.io/developer-docs/latest/development/plugins-development.html

> In a new terminal window, run cd /path/to/myDevelopmentProject && `strapi generate` to launch the interactive strapi generate CLI.

If it is outdated please remove it from the doc. It made me lose a lot of time.


## Configuration file

In the v3 to v4 migration file, it says:

> A v3 plugin was enabled if it was installed or it was found in the plugins directory. In v4, if a plugin is installed (in the package.json dependencies), it is automatically enabled. However, while developing a local plugin you must explicitly enable the plugin in the ./config/plugins.js file of the Strapi application. Disabling any plugin and adding additional config can be done here as well. Here's an example for a local plugin:

Where would you then add a config file for a `none local plugin` ? At the same place but without the `resolve` key?

How do you access the plugin configuration?

Per the documentation: https://docs.strapi.io/developer-docs/latest/developer-resources/plugin-api-reference/server.html#usage
```js
console.log(strapi.plugin('meilisearch').config) // Function
  console.log(strapi.plugin('meilisearch').config()) // undefined
  console.log(strapi.plugin('meilisearch').config.default) // undefined
```

No mention here as well:

https://docs-next.strapi.io/developer-docs/latest/developer-resources/plugin-api-reference/server.html#configuration

Discord aswered me:

```js
console.log(strapi.config.get('plugin.meilisearch'))
```

Which is not documented.

## Accessing Strapi

In the `strapi-server.js` except with the global `strapi` variable is it possible to access the `strapi` api through a function parameter?


**This is not throwing but it does not enter the validator**
```js
  config: ({ strapi }) => ({
    default: ({ env }) => ({ optionA: true }),
    validator: config => {
      console.log('VALIDATOR')
      console.log(config, strapi)
    },
  }),
```

**This is working but the strapi is not passed through function parameter**

```js
  config: {
    default: ({ env }) => ({ optionA: true }),
    validator: config => {
      console.log('VALIDATOR')
      console.log(config)
    },
  },
```

## Strapi API

`Strapi console` does help in knowing what the strapi api contains but does not help on knowing what the usage is. See `strapi console >> strapi.log`


After finding out with the help on discord
`strapi.log.info("test")` does log but also logs the entier `strapi.log` object.

```
[2021-12-06 15:30:19.264] info: test
<ref *1> DerivedLogger {
  _readableState: ReadableState {
    ...
```

## Strapi console

Is it possible to have strapi console running on another port than my strapi app ? I have to close the dev mode to open it. I tried to change it but they both have the same `NODE_ENV`


## Env variable in server.js

I'm not sure that this `env` api does.
```
// config/server.js

module.exports = ({ env }) => {
  return {
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
  }
};

```

## Debuging

Every type error is raised from `strapi-server` while this one comes from `bootstrap.js`. It makes debugging very hard.

```
Error: Could not load js config file /strapi-plugin-meilisearch-v4/playground/src/plugins/meilisearch/strapi-server.js: Unexpected token '}'
    at loadJsFile (/strapi-plugin-meilisearch-v4/playground/node_modules/@strapi/strapi/lib/core/app-configuration/load-config-file.js:18:11)
```
