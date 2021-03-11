/**
 *
 * Block
 */

import React, { memo, useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin'
import pluginId from '../pluginId'
import { Table } from '@buffetjs/core'
import { errorNotifications, successNotification } from '../utils/notifications'
import { Wrapper } from '../components/Wrapper'

const headers = [
  {
    name: 'Name',
    value: 'name'
  },
  {
    name: 'Status',
    value: 'status'
  }
]

const Collections = ({ updateCredentials }) => {
  const [collectionsList, setCollectionsList] = useState([])
  const [updatedCollections, setUpdatedCollections] = useState(false)

  const updateStatus = async ({ indexUid, updateId }) => {
    const response = await request(`/${pluginId}/indexes/${indexUid}/update/${updateId}`, {
      method: 'GET'
    })
    const { error } = response
    if (error) errorNotifications(error)
    else successNotification({ message: `${indexUid} has all its documents indexed` })
    setUpdatedCollections(false)
  }

  const addCollectionToMeiliSearch = async ({ name: indexUid }) => {
    const update = await request(`/${pluginId}/collections/`, {
      method: 'POST',
      body: {
        indexUid
      }
    })
    if (update.error) {
      errorNotifications(update)
    } else {
      successNotification({ message: `${indexUid} is created!` })
      setCollectionsList(prev => prev.map(col => {
        if (col.name === indexUid) col.status = 'enqueued'
        return col
      }))
      updateStatus({ indexUid, updateId: update.updateId })
    }
  }

  const deleteIndex = async ({ name: indexUid }) => {
    const res = await request(`/${pluginId}/indexes/${indexUid}/`, {
      method: 'DELETE'
    })
    if (res.error) errorNotifications(res)
    else successNotification({ message: `${indexUid} collection is removed from MeiliSearch` })
  }

  const addOrRemoveCollection = async (row) => {
    if (row._isChecked) await deleteIndex(row)
    else await addCollectionToMeiliSearch(row)
    setUpdatedCollections(false)
  }

  const fetchCollections = async () => {
    const { collections, error, ...res } = await request(`/${pluginId}/collections/`, {
      method: 'GET'
    })
    if (error) errorNotifications(res)
    else {
      const colStatus = collections.map(col => (
        {
          ...col,
          _isChecked: col.indexed
        }
      ))
      setCollectionsList(colStatus)
      setUpdatedCollections(true)
    }
  }

  useEffect(() => {
    setUpdatedCollections(false)
  }, [updateCredentials])

  useEffect(() => {
    if (!updatedCollections) fetchCollections()
  }, [updatedCollections, updateCredentials])

  return (
      <div className="col-md-12">
          <Wrapper>
              <Table
                className='collections'
                headers={headers}
                rows={collectionsList}
                withBulkAction
                onSelect={(row) => {
                  addOrRemoveCollection(row)
                }}
            />
          </Wrapper>
      </div>
  )
}

export default memo(Collections)
