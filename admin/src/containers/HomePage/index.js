/*
 *
 * HomePage
 *
 */

import React, { memo, useState, useEffect } from 'react'
import { request, useGlobalContext } from 'strapi-helper-plugin'
// import PropTypes from 'prop-types';
import styled from 'styled-components'
import pluginId from '../../pluginId'
import { Button, InputText, Label } from '@buffetjs/core'
import { Header } from '@buffetjs/custom'
import getTrad from '../../utils/getTrad'

const Wrapper = styled.div`
  margin-bottom: 30px;
`

const HomePage = () => {
  const [indexUid, setIndexUid] = useState('')
  const [msApiKey, setApiKey] = useState('')
  const [msHost, setHost] = useState('')
  const [documents, setDocuments] = useState('')
  const { formatMessage } = useGlobalContext()
  useEffect(() => {
    strapi.lockApp()
    async function autoFillMsCredentials () {
      const { apiKey } = await getMeiliSearchCredentials()
      if (apiKey) setApiKey('*******')
    }
    autoFillMsCredentials()
    strapi.unlockApp()
  }, [])

  const addDocuments = async () => {
    strapi.lockApp()
    const res = await request(`/${pluginId}/index/${indexUid}/documents`, {
      method: 'POST',
      body: {
        data: JSON.parse(documents)
      }
    })
    if (res.error) {
      strapi.notification.toggle({
        title: 'Operation on MeiliSearch failed',
        type: 'warning',
        message: res.message,
        ...(res.link ? { link: { url: res.link, label: 'more information' } } : {}),
        timeout: 4000
      })
    }
    strapi.unlockApp()
  }
  const getMeiliSearchCredentials = async () => {
    const { apiKey, host } = await request(`/${pluginId}/credentials/`, {
      method: 'GET'
    })
    setHost(host)
    return { apiKey, host }
  }

  const addMeilisearchCredentials = async () => {
    const { apiKey, host } = await request(`/${pluginId}/credentials/`, {
      method: 'POST',
      body: {
        host: msHost,
        apiKey: msApiKey
      }
    })
    if (apiKey) setApiKey('*******')
    setHost(host)
  }

  return (
    <div className="container-fluid" style={{ padding: '18px 30px 66px 30px' }}>
      <Header
        title={{
          label: formatMessage({ id: getTrad('plugin.name') })
        }}
        content={formatMessage({ id: getTrad('header.description') })}
      />
      <Wrapper>
        <Label htmlFor="MSHost" message="MeiliSearch Host" />
        <InputText
          name="MSHost"
          onChange={({ target: { value } }) => {
            setHost(value)
          }}
          placeholder="Indexname"
          type="text"
          value={msHost}
        />

        <Label htmlFor="MSApiKey" message="MeiliSearch Api Key" />
        <InputText
          name="MSApiKey"
          onChange={({ target: { value } }) => {
            setApiKey(value)
          }}
          placeholder="documents"
          type="text"
          value={msApiKey}
        />
     </Wrapper>
      <Button onClick={getMeiliSearchCredentials}>
        store
      </Button>
      <Button onClick={addMeilisearchCredentials}>
        Add
      </Button>
      <Wrapper>
        <Label htmlFor="indexName" message="Index name" />
        <InputText
          name="indexName"
          onChange={({ target: { value } }) => {
            setIndexUid(value)
          }}
          placeholder="index name"
          type="text"
          value={indexUid}
        />

        <Label htmlFor="documents" message="Documents in JSON string" />
        <InputText
          name="documents"
          onChange={({ target: { value } }) => {
            setDocuments(value)
          }}
          placeholder="documents"
          type="text"
          value={documents}
        />
      </Wrapper>
      <Button onClick={addDocuments}>
        Save
      </Button>
    </div>
  )
}

export default memo(HomePage)
