import { prefixPluginTranslations } from '@strapi/helper-plugin'

import pluginPkg from '../../package.json'
import pluginId from './pluginId'
import getTrad from './utils/getTrad'
import PluginIcon from './components/PluginIcon'
import Initializer from './components/Initializer'
import { PERMISSIONS } from './constants'

const name = pluginPkg.strapi.name

export default {
  register(app) {
    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: true,
      name,
    })

    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: getTrad(`plugin.name`),
        defaultMessage: 'Meilisearch',
      },
      Component: async () => {
        const component = await import(
          /* webpackChunkName: "[request]" */ './containers/HomePage'
        )

        return component
      },
      permissions: PERMISSIONS.main,
    })
  },

  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map(locale => {
        return Promise.all([import(`./translations/${locale}.json`)])
          .then(([pluginTranslations]) => {
            return {
              data: {
                ...prefixPluginTranslations(
                  pluginTranslations.default,
                  pluginId,
                ),
              },
              locale,
            }
          })
          .catch(() => {
            return {
              data: {},
              locale,
            }
          })
      }),
    )
    return Promise.resolve(importedTrads)
  },
}
