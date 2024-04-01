import { useState, useEffect } from 'react'
import { request } from '@strapi/helper-plugin'
import pluginId from '../pluginId'
import useAlert from './useAlert'

export function useCredential() {
  const [credentials, setCredentials] = useState({
    host: '',
    apiKey: '',
    ApiKeyIsFromConfigFile: true,
    HostIsFromConfigFile: true,
  })
  const [refetchIndex, setRefetchIndex] = useState(true)
  const [host, setHost] = useState('')
  const [apiKey, setApiKey] = useState('')
  const { handleNotification, checkForbiddenError } = useAlert()

  const refetchCredentials = () =>
    setRefetchIndex(prevRefetchIndex => !prevRefetchIndex)

  const updateCredentials = async () => {
    try {
      const { error } = await request(`/${pluginId}/credential`, {
        method: 'POST',
        body: {
          apiKey: apiKey,
          host: host,
        },
      })
      if (error) {
        handleNotification({
          type: 'warning',
          message: error.message,
          link: error.link,
        })
      } else {
        refetchCredentials()
        handleNotification({
          type: 'success',
          message: 'Credentials sucessfully updated!',
          blockTransition: false,
        })
      }
    } catch (error) {
      checkForbiddenError(error)
    }
  }

  const fetchCredentials = async () => {
    const { data, error } = await request(`/${pluginId}/credential`, {
      method: 'GET',
    })

    if (error) {
      handleNotification({
        type: 'warning',
        message: error.message,
        link: error.link,
      })
    } else {
      setCredentials(data)
      setHost(data.host)
      setApiKey(data.apiKey)
    }
  }

  useEffect(() => {
    fetchCredentials()
  }, [refetchIndex])

  return {
    credentials,
    updateCredentials,
    setHost,
    setApiKey,
    host,
    apiKey,
  }
}
export default useCredential
