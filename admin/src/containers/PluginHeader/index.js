import React, { memo } from 'react'
import { Box, Link, BaseHeaderLayout } from '@strapi/design-system'
import { ArrowLeft } from '@strapi/icons'

const PluginHeader = () => {
  return (
    <Box background="neutral100">
      <BaseHeaderLayout
        navigationAction={
          <Link startIcon={<ArrowLeft />} to="/">
            Go back
          </Link>
        }
        title="Meilisearch"
        subtitle="strapi-plugin-meilisearch"
        as="h2"
      />
    </Box>
  )
}

export default memo(PluginHeader)
