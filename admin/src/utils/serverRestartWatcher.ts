/**
 * Taken from https://github.com/strapi/strapi/blob/7f1333f1967e625c57ab16648c057aea08c9dddb/packages/core/content-type-builder/admin/src/components/DataManagerProvider/utils/serverRestartWatcher.ts
 */

const SERVER_HAS_NOT_BEEN_KILLED_MESSAGE = 'did-not-kill-server'
const SERVER_HAS_BEEN_KILLED_MESSAGE = 'server is down'

/**
 * Server restart watcher
 * Sends an HEAD method to check if the server has been shut down correctly
 * and then pings until it's back on
 */
export function serverRestartWatcher(
  response: any,
  didShutDownServer?: boolean,
) {
  return new Promise(resolve => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    fetch(`${window.strapi.backendURL}/_health`, {
      method: 'HEAD',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
        'Keep-Alive': 'false',
      },
    })
      .then(res => {
        if (res.status >= 400) {
          throw new Error(SERVER_HAS_BEEN_KILLED_MESSAGE)
        }

        if (!didShutDownServer) {
          throw new Error(SERVER_HAS_NOT_BEEN_KILLED_MESSAGE)
        }

        resolve(response)
      })
      .catch(err => {
        setTimeout(() => {
          return serverRestartWatcher(
            response,
            err.message !== SERVER_HAS_NOT_BEEN_KILLED_MESSAGE,
          ).then(resolve)
        }, 100)
      })
  })
}
