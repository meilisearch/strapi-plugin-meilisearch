class MeiliSearchError extends Error {
  constructor ({ message = 'Something went wrong with MeiliSearch', title = 'Operation on MeiliSearch failed', link }, ...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchError)
    }
    this.name = 'MeiliSearchError'
    this.type = 'MeiliSearchError'
    this.message = message
    this.title = title
    this.link = link
  }
}

module.exports = MeiliSearchError
