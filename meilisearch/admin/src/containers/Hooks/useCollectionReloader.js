import { useState, useEffect } from 'react'
import { request } from '@strapi/helper-plugin'
import pluginId from '../../pluginId'
const hookingTextRendering = ({ indexed, listened }) => {
  if (indexed && !listened) return 'Reload needed'
  if (!indexed && listened) return 'Reload needed'
  if (indexed && listened) return 'Hooked'
  if (!indexed && !listened) return '/'
}

/**
 * Reload request of the server.
 */
export const reloadServer = async () => {
  try {
    // FIXME: cannot wait as unlockApp does not exist on the STRAPI API anymore
    await request(
      `/${pluginId}/reload`,
      {
        method: 'GET',
      },
      true
    )
    window.location.reload()
  } catch (err) {
    console.error(err)
  }
}

export function useCollectionReloader() {
  const [isOnline, setIsOnline] = useState(false)
  const [collections, setCollections] = useState([])
  const [refetchIndex, setRefetchIndex] = useState(true)
  const [reloadNeeded, setReloadNeeded] = useState(false)
  // const [collectionInWaitMode, setCollectionInWaitMode] = useState([]) // Collections that are waiting for their indexation to complete.

  const refetchCollection = () =>
    setRefetchIndex(prevRefetchIndex => !prevRefetchIndex)

  const fetchCollections = async () => {
    const data = await request(`/${pluginId}/content-type/`, {
      method: 'GET',
    })

    const collections = data.data.contentTypes.map(collection => {
      collection['reloadNeeded'] = hookingTextRendering({
        indexed: collection.indexed,
        listened: collection.listened,
      })
      return collection
    })
    const reload = collections.find(col => col.reloadNeeded === 'Reload needed')
    if (reload) {
      setReloadNeeded(true)
    } else setReloadNeeded(false)
    setCollections(collections)
  }

  const deleteCollection = async ({ contentType }) => {
    await request(`/${pluginId}/content-type/${contentType}`, {
      method: 'DELETE',
    })
    console.log('Delete contentType')
    refetchCollection()
  }

  const addCollection = async ({ contentType }) => {
    await request(`/${pluginId}/content-type`, {
      method: 'POST',
      body: {
        contentType,
      },
    })
    console.log('Add contentType')
    refetchCollection()
  }

  const updateCollection = async ({ contentType }) => {
    await request(`/${pluginId}/content-type`, {
      method: 'PUT',
      body: {
        contentType,
      },
    })
    console.log('Update contentType')
    refetchCollection()
  }

  useEffect(() => {
    fetchCollections()
  }, [isOnline, refetchIndex])

  return {
    setIsOnline,
    collections,
    isOnline,
    deleteCollection,
    addCollection,
    updateCollection,
    reloadNeeded,
    reloadServer,
  }
}

export default useCollectionReloader
