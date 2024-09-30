import React, { memo } from 'react'
import PluginTabs from '../PluginTabs'
import { PERMISSIONS } from '../../constants'
import { Page } from "@strapi/strapi/admin";

const HomePage = () => {
  return (
    (<Page.Protect permissions={PERMISSIONS.main}>
      <div>
        <PluginTabs />
      </div>
    </Page.Protect>)
  );
}

export default memo(HomePage)
