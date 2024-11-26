import { Box, Tabs } from '@strapi/design-system'
import { useRBAC } from '@strapi/strapi/admin'
import React from 'react'

import { useI18n } from '../Hooks/useI18n'
import { PERMISSIONS } from '../constants'
import { CollectionTable } from './Collection'
import { Settings } from './Settings/index'

const PluginTabs = () => {
  const { i18n } = useI18n()

  const { allowedActions: allowedActionsCollection } = useRBAC(
    PERMISSIONS.collections,
  )
  const { allowedActions: allowedActionsSettings } = useRBAC(
    PERMISSIONS.settings,
  )

  const canSeeCollections = Object.values(allowedActionsCollection).some(
    value => !!value,
  )
  const canSeeSettings = Object.values(allowedActionsSettings).some(
    value => !!value,
  )

  return (
    <Tabs.Root defaultValue="collections">
      <Tabs.List>
        <Tabs.Trigger value="collections">
          {i18n('plugin.tab.collections', 'Collections')}
        </Tabs.Trigger>
        <Tabs.Trigger value="settings">
          {i18n('plugin.tab.settings', 'Settings')}
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="collections">
        {canSeeCollections && (
          <Box color="neutral800" padding={4} background="neutral0">
            <CollectionTable />
          </Box>
        )}
      </Tabs.Content>
      <Tabs.Content value="settings">
        {canSeeSettings && (
          <Box color="neutral800" padding={4} background="neutral0">
            <Settings />
          </Box>
        )}
      </Tabs.Content>
    </Tabs.Root>
  )
}

export default PluginTabs
