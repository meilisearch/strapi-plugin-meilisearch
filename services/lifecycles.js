'use strict'
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

async function afterCreate(result, collection, connector) {
  try {
    await connector.addOneEntryInMeiliSearch({
      collection,
      entry: result,
    })
  } catch (e) {
    console.error(e)
  }
}

async function afterDelete(result, collection, connector) {
  try {
    let entriesId = []

    // works with both delete methods
    if (Array.isArray(result)) {
      entriesId = result.map(doc => doc.id)
    } else {
      entriesId = [result.id]
    }
    await connector.deleteEntriesFromMeiliSearch({ collection, entriesId })
  } catch (e) {
    console.error(e)
  }
}

async function afterUpdate(result, collection, connector) {
  try {
    await connector.addOneEntryInMeiliSearch({
      collection,
      entry: result,
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
