/**
 *
 * Block
 */

import React, { memo, useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin'
import pluginId from '../pluginId'
import { Button, InputText, Label } from '@buffetjs/core'
import { Wrapper } from '../components/Wrapper'

const Credentials = ({ setUpdatedCredentials }) => {
  const [msApiKey, setApiKey] = useState('')
  const [msHost, setHost] = useState('')
  const [configFileApiKey, setconfigFileApiKey] = useState('')
  const [configFileHost, setconfigFileHost] = useState('')

  useEffect(() => {
    strapi.lockApp()
    async function fillMeilisearchCredentials() {
      const { apiKey, host, configFileApiKey, configFileHost } = await request(
        `/${pluginId}/credentials/`,
        {
          method: 'GET',
        }
      )
      setApiKey(apiKey)
      setconfigFileApiKey(configFileApiKey)
      setHost(host)
      setconfigFileHost(configFileHost)
    }
    fillMeilisearchCredentials()
    strapi.unlockApp()
  }, [])

  const addMeilisearchCredentials = async () => {
    const { apiKey, host } = await request(`/${pluginId}/credentials/`, {
      method: 'POST',
      body: {
        host: msHost,
        apiKey: msApiKey,
      },
    })
    strapi.notification.toggle({
      type: 'success',
      message: 'MeiliSearch Credentials Updated!',
      timeout: 4000,
    })
    setApiKey(apiKey)
    setHost(host)
    setUpdatedCredentials(prev => !prev)
  }

  return (
    <div className="col-md-12">
      <Wrapper>
        <Label
          htmlFor="MSHost"
          message={`MeiliSearch Host ${
            configFileHost ? ' loaded from config file' : ``
          }`}
        />
        <InputText
          name="MSHost"
          onChange={({ target: { value } }) => {
            setHost(value)
          }}
          placeholder="Host"
          type="text"
          value={msHost}
          disabled={configFileHost}
          aria-disabled={configFileHost}
        />
        <Label
          htmlFor="MSApiKey"
          message={`MeiliSearch Api Key ${
            configFileApiKey ? ' loaded from config file' : ''
          }`}
        />
        <InputText
          name="MSApiKey"
          onChange={({ target: { value } }) => {
            setApiKey(value)
          }}
          placeholder="apiKey"
          type="text"
          value={configFileApiKey ? '****' : msApiKey}
          disabled={configFileApiKey}
          aria-disabled={configFileApiKey}
        />
        <Button
          color={!(configFileApiKey && configFileHost) ? 'primary' : 'disabled'}
          className="credentials_button"
          onClick={addMeilisearchCredentials}
          style={{ marginTop: '20px' }}
          disabled={configFileApiKey && configFileHost}
          aria-disabled={configFileApiKey && configFileHost}
        >
          Add
        </Button>
      </Wrapper>
    </div>
  )
}

export default memo(Credentials)
