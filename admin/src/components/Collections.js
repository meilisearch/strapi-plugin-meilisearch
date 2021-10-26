/**
 *
 * Block
 */

import React, { memo, useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin'
import pluginId from '../pluginId'
import { Table, Button } from '@buffetjs/core'
import { errorNotifications, successNotification } from '../utils/notifications'
import { Wrapper } from '../components/Wrapper'
import styled from 'styled-components'

export const UpdateButton = styled(Button)`
  display: flex;
  align-items: center;
  color: primary;
`

export const ReloadButton = styled(Button)`
  display: flex;
  align-items: center;
  color: delete;
`

const headers = [
  {
    name: 'Collection',
    value: 'collection',
  },
  {
    name: 'In MeiliSearch',
    value: 'indexed',
  },
  {
    name: 'Indexing',
    value: 'isIndexing',
  },
  {
    name: 'Index',
    value: 'indexUid',
  },
  {
    name: 'Documents',
    value: 'numberOfDocuments',
  },
  {
    name: 'Hooks',
    value: 'hooked',
  },
]

const Collections = ({ updateCredentials }) => {
  const [collectionsList, setCollectionsList] = useState([]) // All Collections
  const [updatedCollections, setUpdatedCollections] = useState(false) // Boolean that informs if collections have been updated.
  const [needReload, setNeedReload] = useState(false) // Boolean to inform that reload is requested.
  const [watching, setWatchingCollection] = useState([false]) // Collections that are waiting for their indexation to complete.

  // Adds a listener that informs if collections have been updated.
  useEffect(() => {
    setUpdatedCollections(false)
  }, [updateCredentials])

  // Adds a listener that updates collections informations when an update occured.
  useEffect(() => {
    if (!updatedCollections) fetchCollections()
  }, [updatedCollections, updateCredentials])

  /**
   * Watches a collection (if not already)
   * For a maximum of 5 enqueued updates in MeiliSearch.
   *
   * @param {string} collection - Collection name.
   */
  const watchUpdates = async ({ collection }) => {
    if (!watching.includes(collection)) {
      setWatchingCollection(prev => [...prev, collection])
      const response = await request(
        `/${pluginId}/collection/${collection}/update/`,
        {
          method: 'GET',
        }
      )
      if (response.error) errorNotifications(response)

      setWatchingCollection(prev => prev.filter(col => col !== collection))
      setUpdatedCollections(false) // Ask for collections to be updated.
    }
  }

  /**
   * Add a collection to MeiliSearch
   *
   * @param {string} collection - Collection name.
   */
  const addCollection = async ({ collection }) => {
    setCollectionsList(prev =>
      prev.map(col => {
        if (col.collection === collection)
          return { ...col, indexed: 'Creating..', _isChecked: true }
        return col
      })
    )
    const response = await request(`/${pluginId}/collections/${collection}`, {
      method: 'POST',
    })
    if (response.error) {
      errorNotifications(response)
    } else {
      successNotification({
        message: `${collection} is created!`,
        duration: 4000,
      })
      watchUpdates({ collection }) // start watching
    }
    setUpdatedCollections(false) // Ask for collections to be updated.
  }

  /**
   * Re-indexes all entries from a given collection to MeilISearch
   *
   * @param {string} collection - Collection name.
   */
  const updateCollections = async ({ collection }) => {
    setCollectionsList(prev =>
      prev.map(col => {
        if (col.collection === collection)
          return { ...col, indexed: 'Start update...', _isChecked: true }
        return col
      })
    )
    const response = await request(`/${pluginId}/collections/${collection}/`, {
      method: 'PUT',
    })
    if (response.error) {
      errorNotifications(response)
    } else {
      successNotification({ message: `${collection} update started!` })
      watchUpdates({ collection }) // start watching
    }
    setUpdatedCollections(false) // Ask for collections to be updated.
  }

  /**
   * Remove a collection from MeiliSearch.
   *
   * @param {string} collection - Collection name.
   */
  const removeCollection = async ({ collection }) => {
    const res = await request(`/${pluginId}/collections/${collection}/`, {
      method: 'DELETE',
    })
    if (res.error) errorNotifications(res)
    else
      successNotification({
        message: `${collection} collection is removed from MeiliSearch!`,
        duration: 4000,
      })
    setUpdatedCollections(false) // Ask for collections to be updated.
  }

  /**
   * Depending on the checkbox states will either:
   * - Add the collection to MeiliSearch
   * - Remove the collection from MeiliSearch
   *
   * @param {object} Row - One row information from the table.
   */
  const addOrRemoveCollection = async row => {
    if (row._isChecked) await removeCollection(row)
    else addCollection(row)
  }

  /**
   * Determine if a collection needs a server reload to be up to date.
   *
   * @returns {string} - Reload status
   */
  const constructReloadStatus = (indexed, hooked) => {
    if ((indexed && !hooked) || (!indexed && hooked)) {
      return 'Reload needed'
    } else if (indexed && hooked) {
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
  const constructColRow = col => {
    const { indexed, isIndexing, numberOfDocuments, numberOfEntries } = col
    return {
      ...col,
      indexed: indexed ? 'Yes' : 'No',
      isIndexing: isIndexing ? 'Yes' : 'No',
      numberOfDocuments: `${numberOfDocuments} / ${numberOfEntries}`,
      hooked: constructReloadStatus(col.indexed, col.hooked),
      _isChecked: col.indexed,
    }
  }

  /**
   * Fetches extended information about collections in MeiliSearch.
   */
  const fetchCollections = async () => {
    const { collections, error, ...res } = await request(
      `/${pluginId}/collections/`,
      {
        method: 'GET',
      }
    )

    if (error) errorNotifications(res)
    else {
      // Start watching collection that are being indexed
      collections.map(
        col => col.isIndexing && watchUpdates({ collection: col.collection })
      )
      // Create verbose text that will be showed in the table
      const verboseCols = collections.map(col => constructColRow(col))
      // Find possible collection that needs a reload to activate its hooks
      const reloading = verboseCols.find(col => col.hooked === 'Reload needed')

      setNeedReload(reloading)
      setCollectionsList(verboseCols)
      setUpdatedCollections(true) // Collection information is up to date
    }
  }

  /**
   * Reload request of the server.
   */
  const reload = async () => {
    try {
      strapi.lockApp({ enabled: true })
      const { error, ...res } = await request(
        `/${pluginId}/reload`,
        {
          method: 'GET',
        },
        true
      )
      if (error) {
        errorNotifications(res)
        strapi.unlockApp()
      } else {
        window.location.reload()
      }
    } catch (err) {
      strapi.unlockApp()
      errorNotifications({ message: 'Could not reload the server' })
    }
  }

  return (
    <div className="col-md-12">
      <Wrapper>
        <Table
          className="collections"
          headers={headers}
          rows={collectionsList}
          withBulkAction
          onSelect={row => {
            addOrRemoveCollection(row)
          }}
          onClickRow={(e, data) => {
            addOrRemoveCollection(data)
          }}
          rowLinks={[
            {
              icon: <UpdateButton forwardedAs="span">Update</UpdateButton>,
              onClick: data => {
                updateCollections({ collection: data.collection })
              },
            },
          ]}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {needReload && (
            <Button
              color="delete"
              className="reload_button"
              onClick={() => {
                reload()
              }}
              style={{ marginTop: '20px' }}
            >
              Reload Server
            </Button>
          )}
        </div>
      </Wrapper>
    </div>
  )
}

export default memo(Collections)
