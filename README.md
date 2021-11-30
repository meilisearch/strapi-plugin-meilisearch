⚠️WIP⚠️

<p align="center">
  <img src="https://raw.githubusercontent.com/meilisearch/integration-guides/main/assets/logos/meilisearch_strapi.svg" alt="MeiliSearch-Strapi" width="200" height="200" />
</p>

<h1 align="center">WIP: MeiliSearch Strapi Plugin v4</h1>

While the directory of the plugin is at the root of the repository, the plugin is added in `playground/src/plugins` using a symbolic link.

The playground access the plugin correctly as the `console.log` from the `bootstrap` function are visible in the terminal.

To start the playground with the plugin integrated:
```
cd playground
yarn
yarn develop
```



import { prefixPluginTranslations } from '@strapi/helper-plugin'
import pluginPkg from '../../package.json'
import pluginId from './pluginId'
import Initializer from './components/Initializer'
import PluginIcon from './components/PluginIcon'

const name = pluginPkg.strapi.name

console.log('Outside')

export default {
  register(app) {
    console.log('-------')
    console.log(pluginId)
    console.log('-------')

    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: true,
      name,
      description: 'TEST',
    })

    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: name,
      },
      Component: async () => {
        const component = await import(
          /* webpackChunkName: "[request]" */ './containers/HomePage'
        )

        return component
      },
      permissions: [],
    })
  },

  bootstrap(app) {},
  async registerTrads({ locales }) {
    console.log(pluginId)
    const importedTrads = await Promise.all(
      locales.map(locale => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            }
          })
          .catch(() => {
            return {
              data: {},
              locale,
            }
          })
      })
    )

    return Promise.resolve(importedTrads)
  },
}


/**
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { NotFound } from 'strapi-helper-plugin'
import { ThemeProvider } from 'styled-components'
// Utils
import pluginId from '../../pluginId'
// Containers
import HomePage from '../HomePage'

const theme = {
  colors: {
    backgroundColor: '#ffffff',
    shadows: '#e3e9f3',
  },
}

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Switch>
        <Route path={`/plugins/${pluginId}`} component={HomePage} exact />
        <Route component={NotFound} />
      </Switch>
    </ThemeProvider>
  )
}

export default App
