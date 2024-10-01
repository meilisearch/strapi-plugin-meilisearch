/**
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { Page } from '@strapi/strapi/admin'
import { DesignSystemProvider } from '@strapi/design-system'

// Constants
import { PERMISSIONS } from '../constants'
// Pages
import { HomePage } from './HomePage'

const theme = {
  colors: {
    backgroundColor: '#ffffff',
    shadows: '#e3e9f3',
  },
}

const App = () => {
  return (
    <Page.Protect permissions={PERMISSIONS.main}>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="*" element={<Page.Error />} />
      </Routes>
    </Page.Protect>
  )
}

export { App }
