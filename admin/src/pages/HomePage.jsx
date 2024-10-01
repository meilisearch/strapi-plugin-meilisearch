import React, { memo } from 'react'
import { Main } from '@strapi/design-system'

// import PluginHeader from '../containers/PluginHeader'
import PluginTabs from '../containers/PluginTabs'

const HomePage = () => {
  return (
    <Main>
      <div>welcome</div>
      {/* <PluginHeader /> */}
      <PluginTabs />
    </Main>
  )
}

export { HomePage }
