import { getDocumentOrNull } from './meilisearch'

/**
 * Fetch an indexed restaurant row by Strapi `documentId`.
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
    documentId: `restaurant-${documentId}`,
  })
}
