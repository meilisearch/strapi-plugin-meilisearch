/**
 * Convert document service results into Strapi entry candidates with source metadata.
 *
 * @param {object|object[]|null|undefined} result - Value returned by document service.
 *
 * @returns {{data: object, source: string}[]} Flat list of potential Strapi entry candidates.
 */
export const extractStrapiEntryCandidates = result => {
  if (result == null) return []

  const candidates = []
  const appendCandidate = (data, source) => {
    if (data != null && typeof data === 'object') {
      candidates.push({ data, source })
    }
  }

  if (Array.isArray(result)) {
    result.forEach(data => appendCandidate(data, 'root'))
    return candidates
  }

  appendCandidate(result, 'root')

  if (Array.isArray(result.versions)) {
    result.versions.forEach(data => appendCandidate(data, 'versions'))
  }

  if (Array.isArray(result.entries)) {
    result.entries.forEach(data => appendCandidate(data, 'entries'))
  }

  if (result.entry != null) {
    appendCandidate(result.entry, 'entry')
  }

  return candidates
}

/**
 * Determine whether a Strapi entry represents a published version.
 *
 * @param {object} entry - Strapi entry candidate.
 *
 * @returns {boolean} True when `publishedAt` is set.
 */
export const isPublishedStrapiEntry = entry =>
  !(entry?.publishedAt === undefined || entry?.publishedAt === null)

/**
 * Rank Strapi entry candidates by entry-likeness so nested entries beat root wrappers.
 * Rule 1: Real DB entries (has 'id' primary key) beat wrappers (no 'id').
 * Rule 2: Nested sources ('versions', 'entries') beat the 'root' source.
 *
 * @param {{data: object, source: string}[]} candidates - Candidates matching one Strapi document id.
 *
 * @returns {{data: object, source: string}[]} Ranked Strapi entry candidates.
 */
export const rankStrapiEntryCandidates = candidates => {
  return [...candidates].sort((a, b) => {
    const aHasPrimaryKey = a.data?.id != null
    const bHasPrimaryKey = b.data?.id != null

    if (aHasPrimaryKey && !bHasPrimaryKey) return -1
    if (!aHasPrimaryKey && bHasPrimaryKey) return 1

    const aIsRoot = a.source === 'root'
    const bIsRoot = b.source === 'root'

    if (!aIsRoot && bIsRoot) return -1
    if (aIsRoot && !bIsRoot) return 1

    return 0
  })
}
