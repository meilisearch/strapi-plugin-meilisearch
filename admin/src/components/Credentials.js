/**
 *
 * Block
 */

import React, { memo, useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin'
import pluginId from '../pluginId'
import { Button, InputText, Label, Text } from '@buffetjs/core'
import { Wrapper } from '../components/Wrapper'

const Credentials = ({ setUpdatedCredentials }) => {
  const [msApiKey, setApiKey] = useState('')
  const [msHost, setHost] = useState('')
  const [configFileApiKey, setconfigFileApiKey] = useState(false)
  const [configFileHost, setconfigFileHost] = useState(false)

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
      message: 'Meilisearch Credentials Updated!',
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
          message={`Meilisearch Host ${configFileHost ? ' from file' : ``}`}
        />
        <InputText
          name="MSHost"
          onChange={({ target: { value } }) => {
            setHost(value)
          }}
          placeholder="Host"
          type="text"
          value={configFileHost ? '********' : msHost}
          disabled={configFileHost}
          aria-disabled={configFileHost}
        />
        <Label
          htmlFor="MSApiKey"
          message={`Meilisearch Private Key ${
            configFileApiKey ? ' from file' : ''
          }`}
        />
        <InputText
          name="MSApiKey"
          onChange={({ target: { value } }) => {
            setApiKey(value)
          }}
          placeholder="private key"
          type="text"
          value={configFileApiKey ? '********' : msApiKey}
          disabled={configFileApiKey}
          aria-disabled={configFileApiKey}
        />
        <Text
          color="orange"
          lineHeight="2"
          fontWeight="bold"
          fontSize="sm"
          ellipsis
        >
          Do not use this api key on your front-end as it has full rights.
          Instead, use the public key available using{' '}
          <a href="https://docs.meilisearch.com/reference/api/keys.html#get-keys">
            the key route
          </a>
          .
        </Text>
        <Button
          color={!(configFileApiKey && configFileHost) ? 'primary' : 'cancel'}
          className="credentials_button"
          onClick={addMeilisearchCredentials}
          style={{ marginTop: '20px' }}
          disabled={!!configFileApiKey && !!configFileHost}
          aria-disabled={configFileApiKey && configFileHost}
        >
          {!!configFileApiKey && !!configFileHost ? 'Disabled' : 'Update'}
        </Button>
      </Wrapper>
    </div>
  )
}

export default memo(Credentials)
