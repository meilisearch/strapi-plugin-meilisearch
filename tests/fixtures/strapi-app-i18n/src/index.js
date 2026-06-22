/**
 * Ensure the French locale exists for i18n indexing scenarios.
 *
 * @param {import('@strapi/strapi').Core.Strapi} strapi - Strapi instance.
 * @returns {Promise<void>} Resolves when locale is present.
 */
async function ensureFrenchLocale(strapi) {
  const localeQuery = strapi.db.query('plugin::i18n.locale')
  const locale = await localeQuery.findOne({ where: { code: 'fr' } })

  if (!locale) {
    await localeQuery.create({
      data: {
        code: 'fr',
        name: 'French (fr)',
      },
    })
  }
}

module.exports = {
  /**
   * Initialize fixture app content setup.
   *
   * @param {{ strapi: import('@strapi/strapi').Core.Strapi }} context - Bootstrap context.
   * @returns {Promise<void>} Resolves when fixture initialization is complete.
   */
  async bootstrap({ strapi }) {
    await ensureFrenchLocale(strapi)

    const meilisearchPlugin = strapi.plugin('meilisearch')
    const store = meilisearchPlugin.service('store')
    const meilisearch = meilisearchPlugin.service('meilisearch')

    const contentType = 'api::restaurant.restaurant'
    const indexedContentTypes = await store.getIndexedContentTypes()

    if (!indexedContentTypes.includes(contentType)) {
      await meilisearch.addContentTypeInMeiliSearch({ contentType })
    }
  },
}
