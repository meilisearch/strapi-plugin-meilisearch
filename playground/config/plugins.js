module.exports = () => {
  // use process.env.NODE_ENV and if conditions
  // to create a custom config for each environment
  // console.
  const env = process.env.NODE_ENV || 'development'

  if (env === 'test') {
    return {}
  }
  else if (env === 'production') {
    return {
      meilisearch: {
        apiKey: "masterKey",
        host: "http://localhost:7700"
      }
    }
  }
  return {
    meilisearch: {
      apiKey: "masterKey",
      host: "http://localhost:7700"
    }
  }
}

