/**
 * Resolve document ids passed directly in action params.
 *
 * @param {object|null|undefined} actionParams - Document service action params.
 *
 * @returns {string[]} Unique document ids found in params.
 */
export const resolveDocumentIdsFromActionParams = actionParams => {
  const explicitDocumentIds = Array.isArray(actionParams?.documentIds)
    ? actionParams.documentIds.filter(
        documentId => typeof documentId === 'string' && documentId.length > 0,
      )
    : []

  const singleDocumentId =
    typeof actionParams?.documentId === 'string' &&
    actionParams.documentId.length > 0
      ? [actionParams.documentId]
      : []

  return [...new Set([...explicitDocumentIds, ...singleDocumentId])]
}

/**
 * Resolve document ids from action params, middleware result, and pre-action snapshots.
 *
 * @param {object} options - Document id resolution options.
 * @param {object|null|undefined} options.actionParams - Document service action params.
 * @param {object|object[]|null|undefined} options.result - Result returned by document service.
 * @param {{documentId: string}[]|null|undefined} options.preActionSnapshots - Pre-action snapshots keyed by document id.
 *
 * @returns {string[]} Unique document ids.
 */
export const resolveDocumentIds = ({
  actionParams,
  result,
  preActionSnapshots,
}) => {
  const ids = [...resolveDocumentIdsFromActionParams(actionParams)]

  const appendDocumentId = documentId => {
    if (typeof documentId === 'string' && documentId.length > 0) {
      ids.push(documentId)
    }
  }

  const inspectCandidate = candidate => {
    if (!candidate || typeof candidate !== 'object') return
    appendDocumentId(candidate.documentId)
  }

  if (Array.isArray(result)) {
    result.forEach(inspectCandidate)
  } else {
    inspectCandidate(result)
  }

  ;(preActionSnapshots || []).forEach(snapshot =>
    appendDocumentId(snapshot?.documentId),
  )

  return [...new Set(ids)]
}
