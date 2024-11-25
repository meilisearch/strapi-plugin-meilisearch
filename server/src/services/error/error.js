export default ({ strapi }) => {
  const store = strapi.plugin('meilisearch').service('store')
  return {
    async createError(e) {
      strapi.log.error(`meilisearch: ${e.message}`)
      const prefix = e.stack.split(':')[0]
      if (prefix === 'MeiliSearchApiError') {
        return {
          error: {
            message: e.message,
            link: {
              url: e.link || 'https://www.meilisearch.com/docs',
              label: {
                id: 'notification.meilisearch',
                defaultMessage: 'See more',
              },
            },
          },
        }
      } else if (e.type === 'MeiliSearchCommunicationError') {
        const { host } = await store.getCredentials()
        return {
          error: {
            message: `Could not connect with Meilisearch, please check your host: ${host}`,
          },
        }
      } else {
        const message = e.message
        return {
          error: {
            message: message,
          },
        }
      }
    },
  }
}
