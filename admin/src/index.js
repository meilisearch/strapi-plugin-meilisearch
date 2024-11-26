import pluginPkg from '../../package.json'
import pluginId from './pluginId'
import PluginIcon from './components/PluginIcon'
import Initializer from './components/Initializer'
import { PERMISSIONS } from './constants'
import { getTranslation } from './utils/getTranslation'

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
        id: `${pluginId}.plugin.name`,
        defaultMessage: name,
      },
      Component: async () => {
        const { App } = await import('./pages/App')

        return App
      },
      permissions: PERMISSIONS.main,
    })
  },

  async registerTrads({ locales }) {
    const importedTranslations = await Promise.all(
      locales.map(locale => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: getTranslation(data),
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

    return Promise.resolve(importedTranslations)
  },
}
