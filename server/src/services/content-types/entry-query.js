/**
 * Normalize locale values so wildcard semantics stay consistent across queries.
 *
 * @param {string | undefined} locale - Locale value used in entry queries.
 *
 * @returns {string | undefined} Normalized locale.
 */
export const normalizeEntryLocale = locale => {
  if (locale === 'all') return '*'
  return locale
}

/**
 * Build normalized defaults shared by count and fetch entry queries.
 *
 * @param {object} [options={}] - Query scope options.
 * @param {object} [options.filters={}] - Filter conditions.
 * @param {string} [options.status='published'] - Publication state.
 * @param {string} [options.locale] - Locale to query.
 *
 * @returns {{ filters: object, status: string, locale: string | undefined }} Normalized entry scope.
 */
export const normalizeEntryScope = (options = {}) => {
  const { filters = {}, status = 'published', locale } = options

  return {
    filters,
    status,
    locale: normalizeEntryLocale(locale),
  }
}
