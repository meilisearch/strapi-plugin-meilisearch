import { Box } from '@strapi/design-system/Box'
import React, { memo } from 'react'
import { Typography } from '@strapi/design-system/Typography'
import { Button } from '@strapi/design-system/Button'

const PluginActions = () => {
  return (
    <Box>
      <Box paddingLeft={2} paddingRight={2} paddingTop={3} paddingBottom={3}>
        <Typography variant="beta" textColor="neutral800">
          Danger Zone
        </Typography>
      </Box>
      <Box padding={2}>
        <Typography variant="delta" textColor="neutral800">
          Disable plugin
        </Typography>
      </Box>
      <Box paddingTop={0} paddingLeft={2} paddingRight={2} paddingBottom={2}>
        <Typography variant="omega" textColor="neutral800">
          Removes all content-types from Meilisearch and their associated hooks.
        </Typography>
      </Box>
      <Box paddingTop={2} paddingLeft={2} paddingRight={2} paddingBottom={2}>
        <Button
          disabled
          variant="danger-light"
          onClick={() => console.log('coucou')}
        >
          Disable plugin
        </Button>
      </Box>
      <Box padding={2}>
        <Typography variant="delta" textColor="neutral800">
          Uninstall plugin
        </Typography>
      </Box>
      <Box paddingTop={0} paddingLeft={2} paddingRight={2} paddingBottom={2}>
        <Typography variant="omega" textColor="neutral800">
          Applies the same cleaning as when you remove the plugin. Additionnaly,
          it also uninstalls the plugin.
        </Typography>
      </Box>
      <Box paddingTop={2} paddingLeft={2} paddingRight={2} paddingBottom={2}>
        <Button disabled variant="danger" onClick={() => console.log('coucou')}>
          Disable plugin
        </Button>
      </Box>
    </Box>
  )
}

export default memo(PluginActions)
