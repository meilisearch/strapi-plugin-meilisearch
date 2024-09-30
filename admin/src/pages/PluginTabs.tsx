import { Page } from '@strapi/strapi/admin';
import { Box } from '@strapi/design-system';
import { useI18n } from 'src/hooks/useI18n';
import { PERMISSIONS } from 'src/constants';
import { memo } from 'react'
import Settings from './settings/Settings';
import { Tabs } from '@strapi/design-system';
import CollectionTable from './collection/CollectionTable';

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