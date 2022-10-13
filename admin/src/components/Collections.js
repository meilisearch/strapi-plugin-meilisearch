import React, { memo, useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin'
import pluginId from '../pluginId'
import { Table, Button } from '@buffetjs/core'
import { UpdateButton } from './Buttons'
import { errorNotifications } from '../utils/notifications'
import {
  transformCollections,
  addIndexedStatus,
  createResponseNotification,
} from '../utils/collections'
import { Wrapper } from '../components/Wrapper'
import { reload } from '../utils/reload'
import { headers } from '../utils/collection-header'

/**
 * Collection component.
 * A table of all Strapi collections and their relation with Meilisearch.
 *
 * @param  {object} - updateCredentials
 */
const Collections = ({ updateCredentials }) => {
  const [collectionsList, setCollectionsList] = useState([]) // All Collections
  const [needReload, setNeedReload] = useState(false) // Boolean to inform that reload is requested.
  const [realTimeReports, setRealTimeReports] = useState(false) // List of collection's enqueued task uids.
  const [refetchIndex, setRefetchIndex] = useState(true)

  const refetchCollection = () =>
    setRefetchIndex(prevRefetchIndex => !prevRefetchIndex)

  // Adds a listener that informs if collections have been updated.
  useEffect(() => {
    refetchCollection()
  }, [updateCredentials])

  /**
   * Add a collection to Meilisearch
   *
   * @param {string} collection - Collection name.
   */
  const addCollection = async ({ collection }) => {
    setCollectionsList(prevCols =>
      addIndexedStatus(prevCols, collection, 'Creating...')
    )
    const response = await request(`/${pluginId}/collections/${collection}`, {
      method: 'POST',
    })

    createResponseNotification(response, `${collection} is created!`)

    refetchCollection()
  }

  /**
   * Re-indexes all entries from a given collection to MeilISearch
   *
   * @param {string} collection - Collection name.
   */
  const updateCollections = async ({ collection }) => {
    setCollectionsList(prevCols =>
      addIndexedStatus(prevCols, collection, 'Start update...')
    )
    const response = await request(`/${pluginId}/collections/${collection}/`, {
      method: 'PUT',
    })

    createResponseNotification(response, `${collection} update started!`)

    refetchCollection()
  }

  /**
   * Remove a collection from Meilisearch.
   *
   * @param {string} collection - Collection name.
   */
  const removeCollection = async ({ collection }) => {
    const response = await request(`/${pluginId}/collections/${collection}/`, {
      method: 'DELETE',
    })

    createResponseNotification(
      response,
      `${collection} collection is removed from Meilisearch!`
    )

    refetchCollection()
  }

  /**
   * Depending on the checkbox states will either:
   * - Add the collection to Meilisearch
   * - Remove the collection from Meilisearch
   *
   * @param {object} row - One row information from the table.
   */
  const addOrRemoveCollection = async row => {
    if (row._isChecked) await removeCollection(row)
    else addCollection(row)
  }

  /**
   * Fetches extended information about collections in Meilisearch.
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
      const isIndexing = collections.find(col => col.isIndexing === true)

      setRealTimeReports(isIndexing)

      // Transform collections information to verbose string.
      const renderedCols = collections.map(col => transformCollections(col))

      // Find possible collection that needs a reload to activate the listener.
      const reloading = renderedCols.find(
        col => col.listened === 'Reload needed'
      )

      setNeedReload(reloading) // A reload is required for a collection to be listened or de-listened
      setCollectionsList(renderedCols) // Store all `Strapi collections
    }
  }

  // Start refreshing the collections when a collection is being indexed
  useEffect(() => {
    let interval
    if (realTimeReports) {
      interval = setInterval(() => {
        refetchCollection()
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [realTimeReports])

  useEffect(() => {
    fetchCollections()
  }, [refetchIndex])

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
