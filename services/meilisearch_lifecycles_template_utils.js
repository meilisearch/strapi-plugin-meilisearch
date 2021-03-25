'use strict'

function http (client) {
  return strapi.plugins.meilisearch.services.meilisearch_http(client)
}
function client (credentials) {
  return strapi.plugins.meilisearch.services.meilisearch_client(credentials)
}

async function store () {
  return strapi.plugins.meilisearch.services.plugin_store('meilisearchCredentials')
}

async function initClient () {
  const apiKey = await (await store()).getStoreKey('meilisearchApiKey')
  const host = await (await store()).getStoreKey('meilisearchHost')
  return client({ apiKey, host })
}

async function meilisearchLib (indexUid) {
  const client = await initClient()
  // check if exist
  await http(client).getRawIndex({ indexUid })
  return await http(client)
}

module.exports = meilisearchLib
