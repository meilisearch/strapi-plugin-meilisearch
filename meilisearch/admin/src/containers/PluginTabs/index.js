import React, { memo, useEffect } from 'react'
import { Box } from '@strapi/design-system/Box'
import {
  Tabs,
  Tab,
  TabGroup,
  TabPanels,
  TabPanel,
} from '@strapi/design-system/Tabs'
import { CollectionTable } from '../Collection'
import { Settings } from '../Settings'

const PluginTabs = () => {
  useEffect(() => {})
  return (
    <Box padding={8} margin={10} background="neutral">
      <TabGroup
        label="Some stuff for the label"
        id="tabs"
        onTabChange={selected => console.log(selected)}
      >
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
