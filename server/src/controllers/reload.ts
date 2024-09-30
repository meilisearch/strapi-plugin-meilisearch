import type { Core } from '@strapi/strapi';

async function reloadServer({ strapi }: { strapi: Core.Strapi }) {
  const {
    config: { autoReload },
  } = strapi
  if (!autoReload) {
    return {
      message:
        'Reload is only possible in develop mode. Please reload server manually.',
      title: 'Reload failed',
      error: true,
      link: 'https://strapi.io/documentation/developer-docs/latest/developer-resources/cli/CLI.html#strapi-start',
    }
  } else {
    strapi.reload.isWatching = false
    strapi.reload()
    return { message: 'ok' }
  }
}

const reloadController = ({ strapi }: { strapi: Core.Strapi }) => {
  return {
    /**
     * Reloads the server. Only works in development mode.
     *
     * @param  {object} ctx - Http request object.
     */
    reload(ctx) {
      ctx.send({ message: 'ok' })
      return reloadServer({ strapi })
    },
  }
}

export default reloadController;