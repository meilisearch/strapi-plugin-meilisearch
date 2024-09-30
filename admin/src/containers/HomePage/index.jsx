/*
 *
 * HomePage
 *
 */
import { Page } from '@strapi/strapi/admin'
import React, { memo } from 'react'
import PluginTabs from '../PluginTabs'
import PluginHeader from '../PluginHeader'
import { PERMISSIONS } from '../../constants'

const HomePage = () => {
  return (
    <Page.Protect permissions={PERMISSIONS.main}>
      <div>
        <PluginHeader />
        <PluginTabs />
      </div>
    </Page.Protect>
  )
}

export default memo(HomePage)
