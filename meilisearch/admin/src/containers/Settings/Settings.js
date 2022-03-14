import { Box } from '@strapi/design-system/Box'
import React, { memo } from 'react'
import { Divider } from '@strapi/design-system/Divider'
import Credentials from './Credentials'
import PluginActions from './PluginActions'

const Settings = () => {
  return (
    <Box padding={5}>
      <Credentials />
      <Box padding={2}>
        <Divider background="neutral200" />
      </Box>
      <PluginActions />
    </Box>
  )
}

export default memo(Settings)
