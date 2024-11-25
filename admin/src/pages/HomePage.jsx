import React from 'react'

import {
  BackButton,
  Layouts,
  Page,
  private_AutoReloadOverlayBlockerProvider as AutoReloadOverlayBlockerProvider,
} from '@strapi/strapi/admin'

import { useI18n } from '../Hooks/useI18n'
import PluginTabs from '../containers/PluginTabs'

const HomePage = () => {
  const { i18n } = useI18n()

  return (
    <AutoReloadOverlayBlockerProvider>
      <Page.Main>
        <Layouts.Header
          title={i18n('plugin.name', 'Meilisearch')}
          subtitle={i18n(
            'plugin.description',
            'Search in your content-types with the Meilisearch plugin',
          )}
          navigationAction={<BackButton />}
        />
        <Layouts.Content>
          <PluginTabs />
        </Layouts.Content>
      </Page.Main>
    </AutoReloadOverlayBlockerProvider>
  )
}

export { HomePage }
