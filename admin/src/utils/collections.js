import { errorNotifications, successNotification } from '../utils/notifications'

/**
 * Add a status to the indexed column depending in the triggered action.
 *
 * @param  {string[]} previousCols
 * @param  {string} collection
 * @param  {string} message
 */
export const addIndexedStatus = (previousCols, collection, message) => {
  return previousCols.map(col => {
    if (col.collection === collection)
      return { ...col, indexed: message, _isChecked: true }
    return col
  })
}

/**
 * Determine if a collection needs a server reload to be up to date.
 *
 * @param {boolean} - If the collection is indexed in Meilisearch
 * @param {boolean} - If the collection has a listener
 *
 * @returns {string} - Reload status
 */
export const constructReloadStatus = (indexed, listened) => {
  if ((indexed && !listened) || (!indexed && listened)) {
    return 'Reload needed'
  } else if (indexed && listened) {
    return 'Active'
  } else {
    return ''
  }
}

/**
 * Construct verbose table text.
 *
 * @param {string[]} col - All collumn names.
 */
export const transformCollections = col => {
  const { indexed, isIndexing, numberOfDocuments, numberOfEntries } = col
  return {
    ...col,
    indexed: indexed ? 'Yes' : 'No',
    isIndexing: isIndexing ? 'Yes' : 'No',
    numberOfDocuments: `${numberOfDocuments} / ${numberOfEntries}`,
    listened: constructReloadStatus(col.indexed, col.listened),
    _isChecked: col.indexed,
  }
}

/**
 * Create a notification based on the response success.
 *
 * @param  {string} response - Response from the api.
 * @param  {string} message - Message in case of success.
 */
export const createResponseNotification = (response, message) => {
  if (response.error) {
    errorNotifications(response)
  } else {
    successNotification({ message: message })
  }
}
