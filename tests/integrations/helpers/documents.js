export const RESTAURANT_UID = 'api::restaurant.restaurant'
export const CATEGORY_UID = 'api::category.category'

/**
 * Attach an i18n locale to Strapi document-service params.
 *
 * @param {string} locale - i18n locale code (for example `fr`).
 * @param {object} [params={}] - Original document-service params.
 *
 * @returns {object} Params including the provided locale.
 */
export function localeParams(locale, params = {}) {
  return { ...params, locale }
}

/**
 * Access the restaurant document service in the fixture app.
 *
 * @returns {ReturnType<any>} Restaurant document service client.
 */
export function restaurantDocuments() {
  return global.strapi.documents(RESTAURANT_UID)
}

/**
 * Access the restaurant document service and pre-attach a locale.
 *
 * @param {string} locale - i18n locale code used by returned calls.
 *
 * @returns {{
 *   findOne: (params?: object) => Promise<any>,
 *   findMany: (params?: object) => Promise<any>,
 *   create: (params?: object) => Promise<any>,
 *   update: (params?: object) => Promise<any>,
 *   publish: (params?: object) => Promise<any>,
 *   unpublish: (params?: object) => Promise<any>,
 *   delete: (params?: object) => Promise<any>,
 * }} Locale-bound restaurant document helper.
 */
export function localizedRestaurantDocuments(locale) {
  const documents = restaurantDocuments()

  return {
    findOne(params = {}) {
      return documents.findOne(localeParams(locale, params))
    },
    findMany(params = {}) {
      return documents.findMany(localeParams(locale, params))
    },
    create(params = {}) {
      return documents.create(localeParams(locale, params))
    },
    update(params = {}) {
      return documents.update(localeParams(locale, params))
    },
    publish(params = {}) {
      return documents.publish(localeParams(locale, params))
    },
    unpublish(params = {}) {
      return documents.unpublish(localeParams(locale, params))
    },
    delete(params = {}) {
      return documents.delete(localeParams(locale, params))
    },
  }
}

/**
 * Access the category document service in the fixture app.
 *
 * @returns {ReturnType<any>} Category document service client.
 */
export function categoryDocuments() {
  return global.strapi.documents(CATEGORY_UID)
}

/**
 * Access the category document service and pre-attach a locale.
 *
 * @param {string} locale - i18n locale code used by returned calls.
 *
 * @returns {{
 *   findOne: (params?: object) => Promise<any>,
 *   findMany: (params?: object) => Promise<any>,
 *   create: (params?: object) => Promise<any>,
 *   update: (params?: object) => Promise<any>,
 *   publish: (params?: object) => Promise<any>,
 *   unpublish: (params?: object) => Promise<any>,
 *   delete: (params?: object) => Promise<any>,
 * }} Locale-bound category document helper.
 */
export function localizedCategoryDocuments(locale) {
  const documents = categoryDocuments()

  return {
    findOne(params = {}) {
      return documents.findOne(localeParams(locale, params))
    },
    findMany(params = {}) {
      return documents.findMany(localeParams(locale, params))
    },
    create(params = {}) {
      return documents.create(localeParams(locale, params))
    },
    update(params = {}) {
      return documents.update(localeParams(locale, params))
    },
    publish(params = {}) {
      return documents.publish(localeParams(locale, params))
    },
    unpublish(params = {}) {
      return documents.unpublish(localeParams(locale, params))
    },
    delete(params = {}) {
      return documents.delete(localeParams(locale, params))
    },
  }
}
