/**
 * Reusable sync query presets for document middleware tests.
 */
export const SYNC_PRESETS = {
  default: {},
  allLocales: { locale: '*' },
  draftAllLocales: { status: 'draft', locale: '*' },
  draftFrench: { status: 'draft', locale: 'fr' },
  publishedOnly: { status: 'published' },
  frenchOnly: { locale: 'fr' },
}

/**
 * Build a minimal draft Strapi entry fixture.
 *
 * @param {object} options - Draft entry options.
 * @param {number} options.id - Database id.
 * @param {string} options.documentId - Strapi document id.
 * @param {string} options.locale - Locale code.
 * @param {string} [options.title] - Optional title.
 *
 * @returns {{id:number, documentId:string, locale:string, publishedAt:null, title?:string}}
 */
export const createDraftEntry = ({ id, documentId, locale, title }) => ({
  id,
  documentId,
  locale,
  publishedAt: null,
  ...(title ? { title } : {}),
})

/**
 * Build a minimal published Strapi entry fixture.
 *
 * @param {object} options - Published entry options.
 * @param {number} options.id - Database id.
 * @param {string} options.documentId - Strapi document id.
 * @param {string} options.locale - Locale code.
 * @param {string} [options.title] - Optional title.
 *
 * @returns {{id:number, documentId:string, locale:string, publishedAt:string, title?:string}}
 */
export const createPublishedEntry = ({ id, documentId, locale, title }) => ({
  id,
  documentId,
  locale,
  publishedAt: '2024-01-01',
  ...(title ? { title } : {}),
})
