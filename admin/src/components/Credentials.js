/**
 *
 * Block
 */

import React, { memo, useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin'
import pluginId from '../pluginId'
import styled from 'styled-components'
import { Button, InputText, Label } from '@buffetjs/core'
import { Wrapper } from '../components/Wrapper'

const ButtonWrapper = styled.div`
  margin-top: 20px
`

const Credentials = () => {
  const [msApiKey, setApiKey] = useState('')
  const [msHost, setHost] = useState('')

  useEffect(() => {
    strapi.lockApp()
    async function fillMeilisearchCredentials () {
      const { apiKey, host } = await request(`/${pluginId}/credentials/`, {
        method: 'GET'
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
        apiKey: msApiKey
      }
    })
    strapi.notification.toggle({
      type: 'success',
      message: 'MeiliSearch Credentials Updated!',
      timeout: 4000
    })
    setApiKey(apiKey)
    setHost(host)
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
              <ButtonWrapper>
                  <Button onClick={addMeilisearchCredentials}>
                      Add
                  </Button>
              </ButtonWrapper>
          </Wrapper>
      </div>
  )
}

export default memo(Credentials)
