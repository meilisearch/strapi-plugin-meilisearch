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

  useEffect(() => {
    strapi.lockApp()
    async function fillMeilisearchCredentials() {
      const { apiKey, host } = await request(`/${pluginId}/credentials/`, {
        method: 'GET',
      })
      setApiKey(apiKey)
      setHost(host)
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
        <Label htmlFor="MSHost" message="MeiliSearch Host" />
        <InputText
          name="MSHost"
          onChange={({ target: { value } }) => {
            setHost(value)
          }}
          placeholder="Host"
          type="text"
          value={msHost}
        />
        <Label htmlFor="MSApiKey" message="MeiliSearch Api Key" />
        <InputText
          name="MSApiKey"
          onChange={({ target: { value } }) => {
            setApiKey(value)
          }}
          placeholder="apiKey"
          type="text"
          value={msApiKey}
        />
        <Button
          className="credentials_button"
          onClick={addMeilisearchCredentials}
          style={{ marginTop: '20px' }}
        >
          Add
        </Button>
      </Wrapper>
    </div>
  )
}

export default memo(Credentials)
