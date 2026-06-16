import {
  isPublishedStrapiEntry,
  rankStrapiEntryCandidates,
} from './entry-candidates.js'
import {
  getActionLocale,
  resolvePreferredConcreteLocale,
} from './locale-resolution.js'
import { isWildcardLocale } from '../meilisearch/config'

/**
 * Pick the Strapi entry to index for update-like Strapi document actions.
 *
 * @param {object} options - Entry selection options.
 * @param {{data: object, source: string}[]|null|undefined} options.resultCandidates - Candidate Strapi entries extracted from result.
 * @param {string} options.documentId - Target Strapi document id.
 * @param {object} options.indexingQuery - Plugin indexing query configuration.
 * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
 *
 * @returns {object|null} Selected Strapi entry to index, if any.
 */
export const selectStrapiEntryToIndexFromResult = ({
  resultCandidates,
  documentId,
  indexingQuery,
  actionParams,
}) => {
  const strapiDocumentEntryCandidates = (resultCandidates || []).filter(
    candidate => candidate?.data?.documentId === documentId,
  )
  if (strapiDocumentEntryCandidates.length === 0) return null

  const rankedEntryCandidates = rankStrapiEntryCandidates(
    strapiDocumentEntryCandidates,
  )
  const preferredConcreteLocale = resolvePreferredConcreteLocale({
    indexingQuery,
    actionParams,
  })
  const localeScopedEntryCandidate = preferredConcreteLocale
    ? rankedEntryCandidates.find(
        candidate => candidate?.data?.locale === preferredConcreteLocale,
      )
    : null

  if (indexingQuery?.status === 'draft') {
    const isIndexableDraftEntryCandidate = candidate =>
      candidate?.data?.id != null && !isPublishedStrapiEntry(candidate.data)
    if (preferredConcreteLocale) {
      return localeScopedEntryCandidate &&
        isIndexableDraftEntryCandidate(localeScopedEntryCandidate)
        ? localeScopedEntryCandidate.data
        : null
    }

    const draftEntryCandidate = rankedEntryCandidates.find(
      isIndexableDraftEntryCandidate,
    )
    return draftEntryCandidate?.data || null
  }

  if (preferredConcreteLocale) {
    return localeScopedEntryCandidate &&
      isPublishedStrapiEntry(localeScopedEntryCandidate.data)
      ? localeScopedEntryCandidate.data
      : null
  }

  const publishedEntryCandidate = rankedEntryCandidates.find(candidate =>
    isPublishedStrapiEntry(candidate.data),
  )

  return publishedEntryCandidate?.data || null
}

/**
 * Resolve draft Strapi entries to index for `discardDraft` in draft-only indexes.
 *
 * @param {object} options - Draft selection options.
 * @param {{data: object, source: string}[]|null|undefined} options.resultCandidates - Candidate Strapi entries extracted from result.
 * @param {string} options.documentId - Target Strapi document id.
 * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
 *
 * @returns {object[]} Draft Strapi entries scoped to the requested action locale.
 */
export const selectDraftEntriesForDiscardDraftResult = ({
  resultCandidates,
  documentId,
  actionParams,
}) => {
  const actionLocale = getActionLocale(actionParams)
  const rankedDraftEntryCandidates = rankStrapiEntryCandidates(
    (resultCandidates || []).filter(
      candidate =>
        candidate?.data?.documentId === documentId &&
        !isPublishedStrapiEntry(candidate.data),
    ),
  )
  const rankedLocalizedDraftEntryCandidates = rankedDraftEntryCandidates.filter(
    candidate =>
      typeof candidate?.data?.locale === 'string' &&
      candidate.data.locale.length > 0,
  )

  if (rankedDraftEntryCandidates.length === 0) return []

  if (actionLocale && !isWildcardLocale(actionLocale)) {
    const localeCandidate = rankedLocalizedDraftEntryCandidates.find(
      candidate => candidate?.data?.locale === actionLocale,
    )
    return localeCandidate ? [localeCandidate.data] : []
  }

  if (actionLocale && isWildcardLocale(actionLocale)) {
    const entriesByLocale = new Map()
    rankedLocalizedDraftEntryCandidates.forEach(candidate => {
      const locale = candidate.data.locale
      if (!entriesByLocale.has(locale)) {
        entriesByLocale.set(locale, candidate.data)
      }
    })
    return [...entriesByLocale.values()]
  }

  return [
    rankedLocalizedDraftEntryCandidates[0]?.data ||
      rankedDraftEntryCandidates[0].data,
  ]
}

/**
 * Resolve published Strapi entries when wildcard action locale returns multiple versions.
 *
 * @param {object} options - Wildcard publish options.
 * @param {{data: object, source: string}[]|null|undefined} options.resultCandidates - Candidate Strapi entries extracted from result.
 * @param {string} options.documentId - Target Strapi document id.
 * @param {object|null|undefined} options.actionParams - Action params from document middleware context.
 * @param {object|null|undefined} options.indexingQuery - Plugin indexing query configuration.
 *
 * @returns {object[]} Published Strapi entries keyed by locale/id for wildcard publish actions.
 */
export const selectPublishedEntriesForWildcardPublish = ({
  resultCandidates,
  documentId,
  actionParams,
  indexingQuery,
}) => {
  const actionLocale = getActionLocale(actionParams)
  const indexingLocale = indexingQuery?.locale
  const indexingStatusScope = indexingQuery?.status
  const indexingAllowsPublishedEntries =
    indexingStatusScope == null || indexingStatusScope !== 'draft'
  if (
    !actionLocale ||
    !isWildcardLocale(actionLocale) ||
    !isWildcardLocale(indexingLocale) ||
    !indexingAllowsPublishedEntries
  ) {
    return []
  }

  const rankedPublishedEntryCandidates = rankStrapiEntryCandidates(
    (resultCandidates || []).filter(
      candidate =>
        candidate?.data?.documentId === documentId &&
        isPublishedStrapiEntry(candidate.data),
    ),
  )
  if (rankedPublishedEntryCandidates.length === 0) return []

  const selectedEntries = []
  const seenKeys = new Set()

  rankedPublishedEntryCandidates.forEach(candidate => {
    const strapiEntry = candidate?.data
    if (!strapiEntry || typeof strapiEntry !== 'object') return

    const localeKey =
      typeof strapiEntry.locale === 'string' && strapiEntry.locale.length > 0
        ? `locale:${strapiEntry.locale}`
        : null
    const idKey = strapiEntry.id != null ? `id:${strapiEntry.id}` : null
    const dedupeKey = localeKey || idKey

    if (!dedupeKey || seenKeys.has(dedupeKey)) return
    seenKeys.add(dedupeKey)
    selectedEntries.push(strapiEntry)
  })

  return selectedEntries
}
