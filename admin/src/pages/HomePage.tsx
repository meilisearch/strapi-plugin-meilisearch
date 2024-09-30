/*
 *
 * HomePage
 *
 */
import { Page } from '@strapi/strapi/admin';
import { memo } from 'react'
import { PERMISSIONS } from 'src/constants';
import PluginTabs from './PluginTabs';

const HomePage = () => {
  return (
    <Page.Protect permissions={PERMISSIONS.main}>
      <div>
        <PluginTabs />
      </div>
    </Page.Protect>
  )
}

export default memo(HomePage)