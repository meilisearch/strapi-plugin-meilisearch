import { errorNotifications } from '../utils/notifications'
import { request } from 'strapi-helper-plugin'
import pluginId from '../pluginId'

/**
 * Reload request of the server.
 */
export const reload = async () => {
  try {
    strapi.lockApp({ enabled: true })
    const { error, ...res } = await request(
      `/${pluginId}/reload`,
      {
        method: 'GET',
      },
      true
    )
    if (error) {
      errorNotifications(res)
      strapi.unlockApp()
    } else {
      window.location.reload()
    }
  } catch (err) {
    strapi.unlockApp()
    errorNotifications({ message: 'Could not reload the server' })
  }
}
