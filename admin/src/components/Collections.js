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

  const updateStatus = async ({ collection, updateId }) => {
    const response = await request(`/${pluginId}/indexes/${collection}/update/${updateId}`, {
      method: 'GET'
    })
    const { error } = response
    if (error) errorNotifications(error)
    else successNotification({ message: `${collection} has all its documents indexed` })
    setUpdatedCollections(false)
  }

  const addCollectionToMeiliSearch = async ({ name: collection }) => {
    const update = await request(`/${pluginId}/collections/${collection}/`, {
      method: 'POST'
    })
    if (update.error) {
      errorNotifications(update)
    } else {
      successNotification({ message: `${collection} is created! Don't forget to add hooks`, duration: 4000, link: '#' })
      setCollectionsList(prev => prev.map(col => {
        if (col.name === collection) col.status = 'enqueued'
        return col
      }))
      updateStatus({ collection, updateId: update.updateId })
    }
  }

  const updateCollectionsInMeiliSearch = async ({ collection }) => {
    try {
      const update = await request(`/${pluginId}/collections/${collection}/`, {
        method: 'PUT'
      })
      if (update.error) {
        errorNotifications(update)
      } else {
        successNotification({ message: `${collection} updated!` })
        setCollectionsList(prev => prev.map(col => {
          if (col.name === collection) col.status = 'enqueued'
          return col
        }))
        updateStatus({ collection, updateId: update.updateId })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const removeCollection = async ({ name: collection }) => {
    const res = await request(`/${pluginId}/indexes/${collection}/`, {
      method: 'DELETE'
    })
    if (res.error) errorNotifications(res)
    else successNotification({ message: `${collection} collection is removed from MeiliSearch! \n Don't forget to remove your hooks`, link: '#', duration: 4000 })
  }

  const addOrRemoveCollection = async (row) => {
    if (row._isChecked) await removeCollection(row)
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
                rowLinks={[
                  {
                    icon: <UpdateButton forwardedAs='span'>Update</UpdateButton>,
                    onClick: data => {
                      updateCollectionsInMeiliSearch({ collection: data.name })
                    }
                  }
                ]}
              />
          </Wrapper>
      </div>
  )
}

export default memo(Collections)
