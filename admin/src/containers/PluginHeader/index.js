import React, { memo } from 'react'
import { Box, Link, BaseHeaderLayout } from '@strapi/design-system'
import { ArrowLeft } from '@strapi/icons'
import { useI18n } from '../../Hooks/useI18n'

const PluginHeader = () => {
  const { i18n } = useI18n()

  return (
    <Box background="neutral100">
      <BaseHeaderLayout
        navigationAction={
          <Link startIcon={<ArrowLeft />} to="/">
            {i18n('plugin.go-back', 'Go Back')}
          </Link>
        }
        title={i18n('plugin.name', 'Meilisearch')}
        subtitle={i18n(
          'plugin.description',
          'Search in your content-types with the Meilisearch plugin',
        )}
        as="h2"
      />
    </Box>
  )
}

export default memo(PluginHeader)
