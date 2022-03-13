/*
 *
 * HomePage
 *
 */

import React, { memo } from 'react'
import pluginId from '../../pluginId'
import PluginTabs from '../PluginTabs'
import PluginHeader from '../PluginHeader'

const HomePage = () => {
  return (
    <div>
      <h1>{pluginId}&apos;s HomePage</h1>
      <PluginHeader />
      <PluginTabs />
    </div>
  )
}

export default memo(HomePage)
