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
`

export const ReloadButton = styled(Button)`
  display: flex;
  align-items: center;
  color: delete;
`

const headers = [
  {
    name: 'Name',
    value: 'name',
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
    name: 'Documents',
    value: 'numberOfDocuments',
  },
  {
    name: 'Hooks',
    value: 'hooked',
  },
]

const Collections = ({ updateCredentials }) => {
  const [collectionsList, setCollectionsList] = useState([])
  const [updatedCollections, setUpdatedCollections] = useState(false)
  const [needReload, setNeedReload] = useState(false)
  const [watching, setWatchingCollection] = useState([false])

  useEffect(() => {
    setUpdatedCollections(false)
  }, [updateCredentials])

  useEffect(() => {
    if (!updatedCollections) fetchCollections()
  }, [updatedCollections, updateCredentials])

  // Will start watching a collection (if not already)
  // For a maximum of 5 enqueued updates in MeiliSearch
  const watchUpdates = async ({ collection }) => {
    if (!watching.includes(collection)) {
      setWatchingCollection(prev => [...prev, collection])
      const response = await request(
        `/${pluginId}/indexes/${collection}/update/`,
        {
          method: 'GET',
        }
      )
      if (response.error) errorNotifications(response)

      setWatchingCollection(prev => prev.filter(col => col !== collection))
      setUpdatedCollections(false) // Ask for up to date data
    }
  }

  // Add collection to MeiliSearch
  const addCollection = async ({ name: collection }) => {
    setCollectionsList(prev =>
      prev.map(col => {
        if (col.name === collection)
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
    setUpdatedCollections(false) // Ask for up to date data
  }

  // Re-indexes all rows from a given collection to MeilISearch
  const updateCollections = async ({ collection }) => {
    setCollectionsList(prev =>
      prev.map(col => {
        if (col.name === collection)
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
    setUpdatedCollections(false) // ask for up to date data
  }

  // Remove a collection from MeiliSearch
  const removeCollection = async ({ name: collection }) => {
    const res = await request(`/${pluginId}/indexes/${collection}/`, {
      method: 'DELETE',
    })
    if (res.error) errorNotifications(res)
    else
      successNotification({
        message: `${collection} collection is removed from MeiliSearch!`,
        duration: 4000,
      })
    setUpdatedCollections(false) // ask for up to date data
  }

  // Depending on the checkbox states will eather
  // - Add the collection to MeiliSearch
  // - Remove the collection from MeiliSearch
  const addOrRemoveCollection = async row => {
    if (row._isChecked) await removeCollection(row)
    else addCollection(row)
  }

  // Construct reload status to add in table
  const constructReloadStatus = (indexed, hooked) => {
    if ((indexed && !hooked) || (!indexed && hooked)) {
      return 'Reload needed'
    } else if (indexed && hooked) {
      return 'Active'
    } else {
      return ''
    }
  }

  // Construct verbose table text
  const constructColRow = col => {
    const { indexed, isIndexing, numberOfDocuments, numberOfRows } = col
    return {
      ...col,
      indexed: indexed ? 'Yes' : 'No',
      isIndexing: isIndexing ? 'Yes' : 'No',
      numberOfDocuments: `${numberOfDocuments} / ${numberOfRows}`,
      hooked: constructReloadStatus(col.indexed, col.hooked),
      _isChecked: col.indexed,
    }
  }

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
        col => col.isIndexing && watchUpdates({ collection: col.name })
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

  // Reload request
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
                updateCollections({ collection: data.name })
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
