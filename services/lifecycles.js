'use strict'
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

/**
 * Hook function that triggers after a collection creates an entry.
 *
 * @param  {object} result - Entry added.
 * @param  {string} collection - Collection name.
 * @param  {object} connector - Plugin's connector.
 */
async function afterCreate(result, collection, connector) {
  try {
    // When index was removed from MeiliSearch but hook is still active
    // It will re-recreate the index because `addDocuments` creates the index
    await connector.addOneEntryInMeiliSearch({
      collection,
      entry: result,
    })
  } catch (e) {
    console.error(e)
  }
}

/**
 * Hook function that triggers after a collection deletes an entry.
 *
 * @param  {object} result - Entry added.
 * @param  {string} collection - Collection name.
 * @param  {object} connector - Plugin's connector.
 */
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

/**
 * Hook function that triggers after a collection updates an entry.
 *
 * @param  {object} result - Entry added.
 * @param  {string} collection - Collection name.
 * @param  {object} connector - Plugin's connector.
 */
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
