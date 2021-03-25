'use strict'
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

async function meilisearchService (uid) {
  return await strapi.plugins.meilisearch.services.meilisearch_lifecycles_template_utils(uid)
}

async function afterCreate (result, collection) {
  try {
    await (await this.meilisearchService(collection)).addDocuments({
      indexUid: collection,
      data: [result]
    })
  } catch (e) {
    console.error(e)
  }
}

async function afterDelete (result, collection) {
  try {
    await (await this.meilisearchService(collection)).deleteDocuments({
      indexUid: collection,
      documentIds: [result.id]
    })
  } catch (e) {
    console.error(e)
  }
}

async function afterUpdate (result, collection) {
  try {
    await (await this.meilisearch()).addDocuments({
      indexUid: collection,
      data: [result]
    })
  } catch (e) {
    console.error(e)
  }
}

module.exports = {
  afterCreate,
  afterDelete,
  afterUpdate,
  meilisearchService
}
