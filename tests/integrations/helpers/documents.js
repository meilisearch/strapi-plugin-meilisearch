export const RESTAURANT_UID = 'api::restaurant.restaurant'
export const CATEGORY_UID = 'api::category.category'

/**
 * Access the restaurant document service in the fixture app.
 *
 * @returns {ReturnType<any>} Restaurant document service client.
 */
export function restaurantDocuments() {
  return global.strapi.documents(RESTAURANT_UID)
}

/**
 * Access the category document service in the fixture app.
 *
 * @returns {ReturnType<any>} Category document service client.
 */
export function categoryDocuments() {
  return global.strapi.documents(CATEGORY_UID)
}
