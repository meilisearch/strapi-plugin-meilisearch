import { memo } from 'react'
import { Box } from '@strapi/design-system'
import Credentials from './Credentials'

const Settings = () => {
  return (
    <Box padding={5}>
      <Credentials />
    </Box>
  )
}

export default memo(Settings)