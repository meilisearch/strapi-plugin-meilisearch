/*
 *
 * HomePage
 *
 */
import { CheckPagePermissions } from '@strapi/helper-plugin'
import React, { memo } from 'react'
import PluginTabs from '../PluginTabs'
import PluginHeader from '../PluginHeader'
import { PERMISSIONS } from '../../constants'

const HomePage = () => {
  return (
    <CheckPagePermissions permissions={PERMISSIONS.main}>
      <div>
        <PluginHeader />
        <PluginTabs />
      </div>
    </CheckPagePermissions>
  )
}

export default memo(HomePage)
