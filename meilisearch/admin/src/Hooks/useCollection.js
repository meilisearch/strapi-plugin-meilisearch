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

export function useCollection() {
  const [collections, setCollections] = useState([])
  const [refetchIndex, setRefetchIndex] = useState(true)
  const [reloadNeeded, setReloadNeeded] = useState(false)
  const [realTimeReports, setRealTimeReports] = useState(false)

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

      const isIndexing = collections.find(col => col.isIndexing === true)

      if (!isIndexing) setRealTimeReports(false)
      else setRealTimeReports(true)

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
      handleNotification({
        type: 'success',
        message: 'Request to delete content-type is succesfull',
        blockTransition: false,
      })
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
      handleNotification({
        type: 'success',
        message: 'Request to add a content-type is succesfull',
        blockTransition: false,
      })
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
      handleNotification({
        type: 'success',
        message: 'Request to update content-type is succesfull',
        blockTransition: false,
      })
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [refetchIndex])

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
