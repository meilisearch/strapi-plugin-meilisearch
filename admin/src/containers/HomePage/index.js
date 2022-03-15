/*
 *
 * HomePage
 *
 */

import React, { memo } from 'react'
import PluginTabs from '../PluginTabs'
import PluginHeader from '../PluginHeader'

const HomePage = () => {
  return (
    <div>
      <PluginHeader />
      <PluginTabs />
    </div>
  )
}

export default memo(HomePage)
