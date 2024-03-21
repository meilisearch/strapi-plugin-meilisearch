import pluginPkg from '../../package.json'
import pluginId from './pluginId'
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
        id: `${pluginId}.plugin.name`,
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
}
