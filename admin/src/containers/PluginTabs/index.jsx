import React, { memo } from 'react'
import { Box, Tabs } from '@strapi/design-system'
import { CollectionTable } from '../Collection'
import { Settings } from '../Settings'
import { useI18n } from '../../Hooks/useI18n'
import { Page } from '@strapi/strapi/admin'
import { PERMISSIONS } from '../../constants'

const PluginTabs = () => {
  const { i18n } = useI18n()
  return (
    <Box padding={8} margin={10} background="neutral">
      <Tabs.Root label="Some stuff for the label" id="tabs">
        <Tabs.List>
          <Tabs.Trigger value="collections">
            {i18n('plugin.tab.collections', 'Collections')}
          </Tabs.Trigger>
          <Tabs.Trigger value="settings">
            {i18n('plugin.tab.settings', 'Settings')}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="collections">
          <Page.Protect permissions={PERMISSIONS.collections}>
            <Box color="neutral800" padding={4} background="neutral0">
              <CollectionTable />
            </Box>
          </Page.Protect>
        </Tabs.Content>
        <Tabs.Content value="settings">
          <Page.Protect permissions={PERMISSIONS.settings}>
            <Box color="neutral800" padding={4} background="neutral0">
              <Settings />
            </Box>
          </Page.Protect>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}

export default memo(PluginTabs)
