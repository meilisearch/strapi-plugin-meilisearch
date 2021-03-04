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

const Collections = () => {
  const [collectionsList, setCollectionsList] = useState([])
  const [infoUpdated, setInfoUpdated] = useState(false)

  const updateStatus = async ({ indexUid, updateId }) => {
    await request(`/${pluginId}/indexes/${indexUid}/update/${updateId}`, {
      method: 'GET'
    }).then((response) => {
      const { error } = response
      if (error) errorNotifications(error)
      else successNotification({ message: `${indexUid} has all its documents indexed` })
      setInfoUpdated(false)
    })
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
      await updateStatus({ indexUid, updateId: update.updateId })
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
    setInfoUpdated(false)
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
      setInfoUpdated(true)
    }
  }

  useEffect(() => {
    if (!infoUpdated) fetchCollections()
  }, [infoUpdated])

  return (
      <div className="col-md-12">
          <Wrapper>
              <Table
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
