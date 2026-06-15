import { isWildcardLocale } from '../meilisearch/config'

/**
 * Resolve an explicit action locale from middleware params.
 *
 * @param {object|null|undefined} actionParams - Action params from document middleware context.
 *
 * @returns {string|null} Locale from params when present.
 */
export const getActionLocale = actionParams => {
  return typeof actionParams?.locale === 'string' &&
    actionParams.locale.length > 0
    ? actionParams.locale
    : null
}

/**
 * Resolve the concrete locale that this operation should prioritize.
 *
 * Priority:
 * 1. Concrete action locale in middleware params.
 * 2. Concrete locale from Meilisearch indexing query config.
 *
 * @param {object} options - Locale resolution options.
 * @param {object|null|undefined} options.indexingQuery - Plugin indexing query configuration.
 * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
 *
 * @returns {string|null} Preferred concrete locale when one is available.
 */
export const resolvePreferredConcreteLocale = ({
  indexingQuery,
  actionParams,
}) => {
  const actionLocale = getActionLocale(actionParams)
  if (actionLocale && !isWildcardLocale(actionLocale)) {
    return actionLocale
  }

  const indexingLocale =
    typeof indexingQuery?.locale === 'string' && indexingQuery.locale.length > 0
      ? indexingQuery.locale
      : null

  if (indexingLocale && !isWildcardLocale(indexingLocale)) {
    return indexingLocale
  }

  return null
}

/**
 * Build the locale-scoped query used by `getEntry` for update-like actions.
 *
 * When index config targets all locales (`*`) but the action is locale-scoped,
 * keep every existing query option and only override `locale` with the action locale.
 *
 * @param {object} options - Query resolution options.
 * @param {object|null|undefined} options.indexingQuery - Base query from Meilisearch config.
 * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
 *
 * @returns {object} Query passed to `contentTypeService.getEntry`.
 */
export const resolveLocaleScopedRefetchQuery = ({
  indexingQuery,
  actionParams,
}) => {
  const actionLocale = getActionLocale(actionParams)
  const baseQuery = { ...(indexingQuery || {}) }

  if (!isWildcardLocale(baseQuery.locale) || actionLocale == null) {
    return baseQuery
  }

  return {
    ...baseQuery,
    locale: actionLocale,
  }
}

/**
 * Resolve locales to remove from locale-scoped indexes for delete-like actions.
 *
 * @param {object} options - Locale removal options.
 * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
 * @param {object|null} options.preDeleteStrapiEntry - Entry fetched before running the delete-like action.
 * @param {object[]|null|undefined} options.localeVariants - Locale variants fetched for wildcard action locales.
 *
 * @returns {string[]} Locales to remove from Meilisearch.
 */
export const resolveLocaleCodesToRemoveFromIndex = ({
  actionParams,
  preDeleteStrapiEntry,
  localeVariants,
}) => {
  const actionLocale = getActionLocale(actionParams)

  if (actionLocale && !isWildcardLocale(actionLocale)) {
    return [actionLocale]
  }

  if (actionLocale == null) {
    return typeof preDeleteStrapiEntry?.locale === 'string' &&
      preDeleteStrapiEntry.locale.length > 0
      ? [preDeleteStrapiEntry.locale]
      : []
  }

  return [
    ...new Set(
      (localeVariants || [])
        .map(entry => entry?.locale)
        .filter(locale => typeof locale === 'string' && locale.length > 0),
    ),
  ]
}

/**
 * Resolve locales to remove for create/publish fallback deletes on wildcard indexes.
 *
 * @param {object} options - Action-result locale removal options.
 * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
 * @param {{data: object, source: string}[]|null|undefined} options.resultCandidates - Candidate Strapi entries from action result.
 * @param {object|null|undefined} options.result - Raw action result.
 * @param {string} options.documentId - Target Strapi document id.
 *
 * @returns {string[]} Locales to remove from Meilisearch.
 */
export const resolveLocaleCodesToRemoveFromActionResult = ({
  actionParams,
  resultCandidates,
  result,
  documentId,
}) => {
  const entriesForDocument = (resultCandidates || [])
    .map(candidate => candidate?.data)
    .filter(entry => entry?.documentId === documentId)

  const localeVariants = entriesForDocument
    .filter(
      entry => typeof entry?.locale === 'string' && entry.locale.length > 0,
    )
    .map(entry => ({ documentId: entry.documentId, locale: entry.locale }))

  const preDeleteStrapiEntry =
    entriesForDocument.find(
      entry => typeof entry?.locale === 'string' && entry.locale.length > 0,
    ) ??
    (typeof result?.locale === 'string' && result.locale.length > 0
      ? result
      : (entriesForDocument[0] ?? null))

  return resolveLocaleCodesToRemoveFromIndex({
    actionParams,
    preDeleteStrapiEntry,
    localeVariants,
  })
}

/**
 * Build a unique list of locale codes from Strapi entries.
 *
 * @param {object[]|null|undefined} entries - Strapi entries with optional locale fields.
 *
 * @returns {string[]} Unique locale codes.
 */
export const collectLocaleCodesFromEntries = entries => {
  return [
    ...new Set(
      (entries || [])
        .map(entry => entry?.locale)
        .filter(locale => typeof locale === 'string' && locale.length > 0),
    ),
  ]
}
