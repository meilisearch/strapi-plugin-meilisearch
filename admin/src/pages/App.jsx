/**
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { Page } from '@strapi/strapi/admin'

// Constants
import { PERMISSIONS } from '../constants'
// Pages
import { HomePage } from './HomePage'

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
