/*
 *
 * HomePage
 *
 */

import React, { memo, useState } from 'react'
import { useGlobalContext } from 'strapi-helper-plugin'
import { Header } from '@buffetjs/custom'
import getTrad from '../../utils/getTrad'
import Credentials from '../../components/Credentials'
import Collections from '../../components/Collections'

const HomePage = () => {
  const [updateCredentials, setUpdatedCredentials] = useState()
  const { formatMessage } = useGlobalContext()

  return (
      <div className="container-fluid" style={{ padding: '18px 30px 66px 30px' }}>
          <Header
            title={{
              label: formatMessage({ id: getTrad('plugin.name') })
            }}
            content={formatMessage({ id: getTrad('header.description') })}
        />
          <Credentials setUpdatedCredentials={setUpdatedCredentials} />
          <Collections updateCredentials={updateCredentials} />
      </div>
  )
}

export default memo(HomePage)
