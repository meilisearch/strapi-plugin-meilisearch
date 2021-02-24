/*
 *
 * HomePage
 *
 */

import React, { memo, useEffect, useState } from 'react'
import { request, useGlobalContext } from 'strapi-helper-plugin'
// import PropTypes from 'prop-types';
import styled from 'styled-components';
import pluginId from '../../pluginId'
import { Button, InputText, Label } from "@buffetjs/core";
import { Header } from '@buffetjs/custom';

const getTrad = (id) => `${pluginId}.${id}`;
const Wrapper = styled.div`
  margin-bottom: 30px;
`;

// [
//   {
//     "id": 1,
//     "title": "batman"
//   },
//   {
//     "id": 2,
//     "title": "test"
//   }
// ]



const HomePage = () => {
  const [indexUid, setIndexUid] = useState('');
  const [documents, setDocuments] = useState('');
  const { formatMessage } = useGlobalContext();

  const addDocuments = async () => {
    strapi.lockApp();
    await request(`/${pluginId}/index/${indexUid}/documents`, {
      method: "POST",
      body: {
        data: JSON.parse(documents)
      }
    });
    strapi.unlockApp();
  }

  return (
    <div className="container-fluid" style={{ padding: '18px 30px 66px 30px' }}>
      <Header
        actions={[
          {
            label: "test",
            onClick: () => hello(),
            color: 'primary',
            type: 'button',
            icon: true,
          },
        ]}
        title={{
          label: formatMessage({ id: getTrad('plugin.name') }),
        }}
        content={formatMessage({ id: getTrad('header.description') })}
      />
      <Wrapper>
        <Label htmlFor="input" message="Index name" />
        <InputText
          name="input"
          onChange={({ target: { value } }) => {
            setIndexUid(value);
          }}
          placeholder="Indexname"
          type="text"
          value={indexUid}
        />

        <Label htmlFor="input" message="Documents in JSON string" />
        <InputText
          name="input"
          onChange={({ target: { value } }) => {
            setDocuments(value);
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
