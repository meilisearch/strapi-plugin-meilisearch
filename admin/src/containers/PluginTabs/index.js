import React, { memo } from 'react'
import {
  Box,
  Tab,
  TabGroup,
  TabPanel,
  TabPanels,
  Tabs,
} from '@strapi/design-system'
import { CollectionTable } from '../Collection'
import { Settings } from '../Settings'

const PluginTabs = () => {
  return (
    <Box padding={8} margin={10} background="neutral">
      <TabGroup label="Some stuff for the label" id="tabs">
        <Tabs>
          <Tab>Collections</Tab>
          <Tab>Settings</Tab>
        </Tabs>
        <TabPanels>
          <TabPanel>
            <Box color="neutral800" padding={4} background="neutral0">
              <CollectionTable />
            </Box>
          </TabPanel>
          <TabPanel>
            <Box color="neutral800" padding={4} background="neutral0">
              <Settings />
            </Box>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Box>
  )
}

export default memo(PluginTabs)
