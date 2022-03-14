import { useState, useEffect } from 'react'
import { request } from '@strapi/helper-plugin'
import pluginId from '../pluginId'
import useAlert from './useAlert'

const hookingTextRendering = ({ indexed, listened }) => {
  if (indexed && !listened) return 'Reload needed'
  if (!indexed && listened) return 'Reload needed'
  if (indexed && listened) return 'Hooked'
  if (!indexed && !listened) return '/'
}

/**
 * Reload request of the server.
 */

export function useCollection() {
  const [collections, setCollections] = useState([])
  const [refetchIndex, setRefetchIndex] = useState(true)
  const [reloadNeeded, setReloadNeeded] = useState(false)
  const { handleNotification } = useAlert()

  const refetchCollection = () =>
    setRefetchIndex(prevRefetchIndex => !prevRefetchIndex)

  const fetchCollections = async () => {
    const { data, error } = await request(`/${pluginId}/content-type/`, {
      method: 'GET',
    })

    if (error) {
      handleNotification({
        type: 'warning',
        message: error.message,
        link: error.link,
      })
    } else {
      const collections = data.contentTypes.map(collection => {
        collection['reloadNeeded'] = hookingTextRendering({
          indexed: collection.indexed,
          listened: collection.listened,
        })
        return collection
      })
      const reload = collections.find(
        col => col.reloadNeeded === 'Reload needed'
      )

      if (reload) {
        setReloadNeeded(true)
      } else setReloadNeeded(false)
      setCollections(collections)
    }
  }

  const deleteCollection = async ({ contentType }) => {
    const { error } = await request(
      `/${pluginId}/content-type/${contentType}`,
      {
        method: 'DELETE',
      }
    )
    if (error) {
      handleNotification({
        type: 'warning',
        message: error.message,
        link: error.link,
      })
    } else {
      refetchCollection()
    }
  }

  const addCollection = async ({ contentType }) => {
    const { error } = await request(`/${pluginId}/content-type`, {
      method: 'POST',
      body: {
        contentType,
      },
    })
    if (error) {
      handleNotification({
        type: 'warning',
        message: error.message,
        link: error.link,
      })
    } else {
      refetchCollection()
    }
  }

  const updateCollection = async ({ contentType }) => {
    const { error } = await request(`/${pluginId}/content-type`, {
      method: 'PUT',
      body: {
        contentType,
      },
    })
    if (error) {
      handleNotification({
        type: 'warning',
        message: error.message,
        link: error.link,
      })
    } else {
      refetchCollection()
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [refetchIndex])

  return {
    collections,
    deleteCollection,
    addCollection,
    updateCollection,
    reloadNeeded,
    refetchCollection,
    handleNotification,
  }
}

export default useCollection
