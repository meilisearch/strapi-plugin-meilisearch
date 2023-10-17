import { Box } from '@strapi/design-system'
import React, { memo } from 'react'
import Credentials from './Credentials'

const Settings = () => {
  return (
    <Box padding={5}>
      <Credentials />
    </Box>
  )
}

export default memo(Settings)
