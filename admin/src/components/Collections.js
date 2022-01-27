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
  const [upToDateCollections, setUpToDateCollection] = useState(false) // Boolean that informs if collections have been updated.
  const [needReload, setNeedReload] = useState(false) // Boolean to inform that reload is requested.
  const [collectionInWaitMode, setCollectionInWaitMode] = useState([]) // Collections that are waiting for their indexation to complete.
  const [collectionTaskUids, setCollectionTaskUids] = useState({}) // List of collection's enqueued task uids.

  // Trigger a task uids fetcher to find enqueued task of the indexed collections.
  useEffect(() => {
    findTaskUids()
  }, [])

  // Adds a listener that informs if collections have been updated.
  useEffect(() => {
    setUpToDateCollection(false)
  }, [updateCredentials])

  // Adds a listener that updates collections informations on updates
  useEffect(() => {
    if (!upToDateCollections) fetchCollections()
  }, [upToDateCollections, updateCredentials])

  // Trigger a watch if a collection has enqueued task uid's.
  useEffect(() => {
    for (const collection in collectionTaskUids) {
      if (collectionTaskUids[collection].length > 0) {
        watchTasks({ collection })
      }
    }
  }, [collectionTaskUids])

  /**
   * Find all enqueued task uid's of the indexed collections.
   * It is triggered on load.
   */
  const findTaskUids = async () => {
    const response = await request(`/${pluginId}/collection/tasks`, {
      method: 'GET',
    })

    if (response.error) errorNotifications(response)
    setCollectionTaskUids(response.taskUids)
  }

  /**
   * Watches a collection (if not already)
   * For a maximum of 5 enqueued tasks in Meilisearch.
   *
   * @param {string} collection - Collection name.
   */
  const watchTasks = async ({ collection }) => {
    // If collection has pending tasks
    const taskUids = collectionTaskUids[collection]

    if (!collectionInWaitMode.includes(collection) && taskUids?.length > 0) {
      addIndexedStatus
      setCollectionInWaitMode(prev => [...prev, collection])

      const taskUidsIdsChunk = taskUids.splice(0, 1)
      const response = await request(
        `/${pluginId}/collection/${collection}/tasks/batch`,
        {
          method: 'POST',
          body: { taskUids: taskUidsIdsChunk },
        }
      )

      if (response.error) errorNotifications(response)

      const { tasksStatus } = response

      tasksStatus.map(task => {
        if (task.status === 'failed') {
          task.error.message = `Some documents could not be added: \n${task.error.message}`
          errorNotifications(task.error)
        }
      })

      setCollectionInWaitMode(prev => prev.filter(col => col !== collection))
      setCollectionTaskUids(prev => ({
        ...prev,
        [collection]: taskUids,
      }))

      setUpToDateCollection(false) // Ask for collections to be updated.
    }
  }

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

    if (!response.error) {
      setCollectionTaskUids(prev => ({
        ...prev,
        [collection]: response.taskUids,
      }))
    }

    setUpToDateCollection(false) // Ask for collections to be updated.
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

    if (!response.error) {
      setCollectionTaskUids(prev => ({
        ...prev,
        [collection]: response.taskUids,
      }))
    }

    setUpToDateCollection(false) // Ask for collections to be updated.
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

    setUpToDateCollection(false) // Ask for collections to be updated.
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
      // Start watching collections that have pending tasks
      collections.map(col => {
        if (col.isIndexing) {
          watchTasks({ collection: col.collection })
        }
      })

      // Transform collections information to verbose string.
      const renderedCols = collections.map(col => transformCollections(col))

      // Find possible collection that needs a reload to activate the listener.
      const reloading = renderedCols.find(
        col => col.listened === 'Reload needed'
      )

      setNeedReload(reloading) // A reload is required for a collection to be listened or de-listened
      setCollectionsList(renderedCols) // Store all `Strapi collections
      setUpToDateCollection(true) // Collection information is up to date
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
