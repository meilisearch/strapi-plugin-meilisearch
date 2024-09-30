import React, { memo } from 'react'
import { Page } from "@strapi/strapi/admin";
import { PERMISSIONS } from '../constants';
import PluginTabs from './PluginTabs';

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
