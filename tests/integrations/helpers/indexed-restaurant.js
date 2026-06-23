import { getDocumentOrNull } from './meilisearch'

/**
 * Build a non-localized restaurant Meilisearch document id.
 *
 * @param {string} documentId - Strapi document id.
 *
 * @returns {string} `_meilisearch_id` in `restaurant-<documentId>` format.
 */
export function restaurantMeilisearchId(documentId) {
  return `restaurant-${documentId}`
}

/**
 * Build a localized restaurant Meilisearch document id.
 *
 * @param {string} documentId - Strapi document id.
 * @param {string} locale - i18n locale code.
 *
 * @returns {string} `_meilisearch_id` in `restaurant-<documentId>-<locale>` format.
 */
export function localizedRestaurantMeilisearchId(documentId, locale) {
  return `${restaurantMeilisearchId(documentId)}-${locale}`
}

/**
 * Fetch an indexed restaurant record by Strapi `documentId`.
 *
 * Meilisearch stores this fixture with `_meilisearch_id = restaurant-<documentId>`.
 *
 * @param {object} options
 * @param {import('meilisearch').MeiliSearch} options.client
 * @param {string} options.indexUid
 * @param {string} options.documentId - Strapi document id.
 *
 * @returns {Promise<object|null>} Indexed restaurant document or null.
 */
export async function getIndexedRestaurantByDocumentId({
  client,
  indexUid,
  documentId,
}) {
  return getDocumentOrNull({
    client,
    indexUid,
    documentId: restaurantMeilisearchId(documentId),
  })
}

/**
 * Fetch a localized indexed restaurant record by Strapi `documentId` and locale.
 *
 * Meilisearch stores localized fixtures with
 * `_meilisearch_id = restaurant-<documentId>-<locale>`.
 *
 * @param {object} options
 * @param {import('meilisearch').MeiliSearch} options.client
 * @param {string} options.indexUid
 * @param {string} options.documentId - Strapi document id.
 * @param {string} options.locale - i18n locale code.
 *
 * @returns {Promise<object|null>} Indexed localized restaurant document or null.
 */
export async function getIndexedRestaurantByDocumentIdAndLocale({
  client,
  indexUid,
  documentId,
  locale,
}) {
  return getDocumentOrNull({
    client,
    indexUid,
    documentId: localizedRestaurantMeilisearchId(documentId, locale),
  })
}
