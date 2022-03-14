import { useState, useEffect } from 'react'
import { request } from '@strapi/helper-plugin'
import pluginId from '../../pluginId'

export function useCredentialReloader() {
  const [credentials, setCredentials] = useState({
    host: '',
    apiKey: '',
    ApiKeyIsFromConfigFile: true,
    HostIsFromConfigFile: true,
  })
  const [refetchIndex, setRefetchIndex] = useState(true)
  const [host, setHost] = useState('')
  const [apiKey, setApiKey] = useState('')

  const refetchCredentials = () =>
    setRefetchIndex(prevRefetchIndex => !prevRefetchIndex)

  const updateCredentials = async () => {
    await request(`/${pluginId}/credential`, {
      method: 'POST',
      body: {
        apiKey: apiKey,
        host: host,
      },
    })
    refetchCredentials()
  }

  const fetchCredentials = async () => {
    const credentials = await request(`/${pluginId}/credential`, {
      method: 'GET',
    })
    setCredentials(credentials.data)
    setHost(credentials.data.host)
    setApiKey(credentials.data.apiKey)
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
