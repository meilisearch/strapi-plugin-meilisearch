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
