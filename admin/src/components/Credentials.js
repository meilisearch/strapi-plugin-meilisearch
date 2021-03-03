/**
 *
 * Block
 */

import React, { memo, useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin'
import pluginId from '../pluginId'
// import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, InputText, Label } from '@buffetjs/core'
import { useStrapi } from 'strapi-helper-plugin';

const Wrapper = styled.div`
  margin-bottom: 35px;
  background: #ffffff;
  padding: 22px 28px 18px;
  border-radius: 2px;
  box-shadow: 0 2px 4px #e3e9f3;
  -webkit-font-smoothing: antialiased;
`

const ButtonWrapper = styled.div`
  margin-top: 20px
`

const Credentials = () => {
  const [msApiKey, setApiKey] = useState('')
  const [msHost, setHost] = useState('')
  console.log({ strapi })
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
