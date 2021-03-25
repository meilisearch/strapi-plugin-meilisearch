'use strict'
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

async function afterCreate (result, collection, httpClient) {
  try {
    await httpClient.addDocuments({
      indexUid: collection,
      data: [result]
    })
  } catch (e) {
    console.error(e)
  }
}

async function afterDelete (result, collection, httpClient) {
  try {
    await httpClient.deleteDocuments({
      indexUid: collection,
      documentIds: [result.id]
    })
  } catch (e) {
    console.error(e)
  }
}

async function afterUpdate (result, collection, httpClient) {
  try {
    await httpClient.addDocuments({
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
  afterUpdate
}
