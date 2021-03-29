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
    value: 'name'
  },
  {
    name: 'Status',
    value: 'status'
  },
  {
    name: 'Hooks',
    value: 'hooked'
  }
]

const Collections = ({ updateCredentials }) => {
  const [collectionsList, setCollectionsList] = useState([])
  const [updatedCollections, setUpdatedCollections] = useState(false)
  const [needReload, setNeedReload] = useState(false)

  const updateStatus = async ({ collection, updateId }) => {
    if (updateId) {
      const response = await request(`/${pluginId}/indexes/${collection}/update/${updateId}`, {
        method: 'GET'
      })
      const { error } = response
      if (error) errorNotifications(error)
      else successNotification({ message: `${collection} has all its documents indexed` })
      setUpdatedCollections(false)
    }
  }

  const addCollectionToMeiliSearch = async ({ name: collection }) => {
    const update = await request(`/${pluginId}/collections/${collection}/`, {
      method: 'POST'
    })
    if (update.error) {
      errorNotifications(update)
    } else {
      successNotification({ message: `${collection} is created!`, duration: 4000 })
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
    else successNotification({ message: `${collection} collection is removed from MeiliSearch!`, duration: 4000 })
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
      const reloadNeeded = (indexed, hooked) => {
        if ((indexed && !hooked) || (!indexed && hooked)) {
          return 'Reload needed'
        } else if (indexed && hooked) {
          return 'Active'
        } else {
          return ''
        }
      }

      const colStatus = collections.map(col => (
        {
          ...col,
          status: (col.indexed) ? 'Indexed In MeiliSearch' : 'Not in MeiliSearch',
          hooked: reloadNeeded(col.indexed, col.hooked),
          _isChecked: col.indexed
        }
      ))
      const reloading = colStatus.find(col => col.hooked === 'Reload needed')
      setNeedReload(reloading)
      setCollectionsList(colStatus)
      setUpdatedCollections(true)
    }
  }

  const reload = async () => {
    try {
      strapi.lockApp({ enabled: true })
      const { error, ...res } = await request(`/${pluginId}/reload`, {
        method: 'GET'
      }, true)
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
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {
                  needReload && <Button
                    color="delete"
                    className="reload_button"
                    onClick={() => { reload() }}
                    style={{ marginTop: '20px' }}
                                >
                      Reload Server
                  </Button>
                }
              </div>
          </Wrapper>
      </div>
  )
}

export default memo(Collections)
