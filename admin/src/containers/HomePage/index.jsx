/*
 *
 * HomePage
 *
 */
import { Page } from '@strapi/strapi/admin'
import React, { memo } from 'react'
import PluginTabs from '../PluginTabs'
import { PERMISSIONS } from '../../constants'

const HomePage = () => {
  return (
    <Page.Protect permissions={PERMISSIONS.main}>
      <div>
        <PluginTabs />
      </div>
    </Page.Protect>
  )
}

export default memo(HomePage)
