import { useState, useEffect } from 'react'
import { useFetchClient } from '@strapi/strapi/admin'

import pluginId from '../pluginId'
import useAlert from './useAlert'
import { useI18n } from './useI18n'

export function useCollection() {
  const [collections, setCollections] = useState([])
  const [refetchIndex, setRefetchIndex] = useState(true)
  const [reloadNeeded, setReloadNeeded] = useState(false)
  const [realTimeReports, setRealTimeReports] = useState(false)

  const { handleNotification, checkForbiddenError } = useAlert()
  const { i18n } = useI18n()
  const { get, del, post, put } = useFetchClient()

  const refetchCollection = () =>
    setRefetchIndex(prevRefetchIndex => !prevRefetchIndex)

  const hookingTextRendering = ({ indexed, listened }) => {
    if (indexed && listened)
      return i18n('plugin.table.td.hookingText.hooked', 'Hooked')

    if (!indexed && !listened) return '/'

    return i18n('plugin.table.td.hookingText.reload', 'Reload needed')
  }

  const fetchCollections = async () => {
    try {
      const {
        data: { data, error },
      } = await get(`/${pluginId}/content-type/`)

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
          col =>
            col.reloadNeeded ===
            i18n('plugin.table.td.hookingText.reload', 'Reload needed'),
        )

        const isIndexing = collections.find(col => col.isIndexing === true)

        if (!isIndexing) setRealTimeReports(false)
        else setRealTimeReports(true)

        if (reload) {
          setReloadNeeded(true)
        } else setReloadNeeded(false)
        setCollections(collections)
      }
    } catch (error) {
      checkForbiddenError(error)
    }
  }

  const deleteCollection = async ({ contentType }) => {
    try {
      const {
        data: { error },
      } = await del(`/${pluginId}/content-type/${contentType}`)
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
          message: i18n(
            'plugin.message.success.delete',
            'Request to delete content-type is successful',
          ),
          blockTransition: false,
        })
      }
    } catch (error) {
      checkForbiddenError(error)
    }
  }

  const addCollection = async ({ contentType }) => {
    try {
      const {
        data: { error },
      } = await post(`/${pluginId}/content-type`, {
        contentType,
      })
      console.log(error)
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
          message: i18n(
            'plugin.message.success.add',
            'Request to add a content-type is successful',
          ),
          blockTransition: false,
        })
      }
    } catch (error) {
      checkForbiddenError(error)
    }
  }

  const updateCollection = async ({ contentType }) => {
    try {
      const {
        data: { error },
      } = await put(`/${pluginId}/content-type`, {
        contentType,
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
          message: i18n(
            'plugin.message.success.update',
            'Request to update content-type is successful',
          ),
          blockTransition: false,
        })
      }
    } catch (error) {
      checkForbiddenError(error)
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
