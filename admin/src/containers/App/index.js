/**
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { NotFound } from 'strapi-helper-plugin'
import { ThemeProvider } from 'styled-components'
// Utils
import pluginId from '../../pluginId'
// Containers
import HomePage from '../HomePage'

const theme = {
  colors: {
    backgroundColor: '#ffffff',
    shadows: '#e3e9f3'
  }
}

const App = () => {
  return (
      <ThemeProvider theme={theme} >
          <Switch>
              <Route path={`/plugins/${pluginId}`} component={HomePage} exact />
              <Route component={NotFound} />
          </Switch>
      </ThemeProvider>
  )
}

export default App
