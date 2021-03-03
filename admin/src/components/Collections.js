/**
 *
 * Block
 */

import React, { memo, useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin'
import pluginId from '../pluginId'
// import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Table } from '@buffetjs/core'

const Wrapper = styled.div`
  margin-bottom: 35px;
  background: #ffffff;
  padding: 22px 28px 18px;
  border-radius: 2px;
  box-shadow: 0 2px 4px #e3e9f3;
  -webkit-font-smoothing: antialiased;
`
const headers = [
  {
    name: 'Name',
    value: 'name'
  }
]

const Collections = () => {
  const [collectionsList, setCollectionsList] = useState([])

  useEffect(() => {
    strapi.lockApp()
    async function fetchCollections () {
      const fetchedCollections = await request(`/${pluginId}/collections/`, {
        method: 'GET'
      })

      setCollectionsList(fetchedCollections.map((col, index) => ({
        name: col,
        key: index,
        _isChecked: true
      })))
      console.log(collectionsList)
    }
    fetchCollections()
    strapi.unlockApp()
  }, [])

  return (
      <div className="col-md-12">
          <Wrapper>
              <Table
                headers={headers}
                rows={collectionsList}
                onClickRow={(e, data) => {
                  console.log(data)
                  alert('You have just clicked')
                }}
            />
          </Wrapper>
      </div>
  )
}

export default memo(Collections)
