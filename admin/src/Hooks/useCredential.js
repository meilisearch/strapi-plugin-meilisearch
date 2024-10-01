import { useState, useEffect } from 'react'
import { useFetchClient } from '@strapi/strapi/admin'
import pluginId from '../pluginId'
import useAlert from './useAlert'
import { useI18n } from './useI18n'

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
  const { handleNotification } = useAlert()
  const { i18n } = useI18n()
  const { get, post } = useFetchClient()

  const refetchCredentials = () =>
    setRefetchIndex(prevRefetchIndex => !prevRefetchIndex)

  const updateCredentials = async () => {
    const { error } = await post(`/${pluginId}/credential`, {
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
        message: i18n(
          'plugin.message.success.credentials',
          'Credentials sucessfully updated!',
        ),
        blockTransition: false,
      })
    }
  }

  const fetchCredentials = async () => {
    try {
      const { data } = await get(`/${pluginId}/credential`)
      console.log(data, data.host, data.apiKey)
      setCredentials(data)
      setHost(data.host)
      setApiKey(data.apiKey)
    } catch (error) {
      handleNotification({
        type: 'warning',
        message: error.message,
        link: error.link,
      })
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
