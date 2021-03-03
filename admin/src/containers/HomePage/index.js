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
import Credentials from '../../components/Credentials'
// import Collections from '../../components/Collections'
import Table2 from '../../components/Table'

const Wrapper = styled.div`
  margin-bottom: 30px;
`

const HomePage = () => {
  const [indexUid, setIndexUid] = useState('')

  const [documents, setDocuments] = useState('')
  const { formatMessage } = useGlobalContext()

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
    } else {
      strapi.notification.toggle({
        type: 'success',
        message: 'Documents added!',
        timeout: 4000
      })
    }
    strapi.unlockApp()
  }
  return (
      <div className="container-fluid" style={{ padding: '18px 30px 66px 30px' }}>
          <Header
            title={{
              label: formatMessage({ id: getTrad('plugin.name') })
            }}
            content={formatMessage({ id: getTrad('header.description') })}
          />
          <Credentials />
          {/* <Collections /> */}
          <Table2 />
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
