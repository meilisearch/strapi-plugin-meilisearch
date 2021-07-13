'use strict'
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

async function afterCreate(result, collection, httpClient) {
  try {
    await httpClient.addDocuments({
      indexUid: collection.index || collection.name,
      data: [{...result, id: collection.name + result.id}],
    })
  } catch (e) {
    console.error(e)
  }
}

async function afterDelete(result, collection, httpClient) {
  try {
    const documentIds = Array.isArray(result)
      ? result.map(doc => collection.name + doc.id)
      : [{...result, id: collection.name + result.id}]
    await httpClient.deleteDocuments({
      indexUid: collection.index || collection.name,
      documentIds,
    })
  } catch (e) {
    console.error(e)
  }
}

async function afterUpdate(result, collection, httpClient) {
  try {
    await httpClient.addDocuments({
      indexUid: collection.index || collection.name,
      data: [{...result, id: collection.name + result.id}],
    })
  } catch (e) {
    console.error(e)
  }
}

module.exports = {
  afterCreate,
  afterDelete,
  afterUpdate,
}
