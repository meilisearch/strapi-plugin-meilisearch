/*
 *
 * HomePage
 *
 */

import React, { memo, useEffect } from 'react'
import pluginId from '../../pluginId'
import { request } from '@strapi/helper-plugin'

const HomePage = () => {
  async function callController() {
    const response = await request(`/${pluginId}/model/`, {
      method: 'GET',
    })
    console.log(response)
  }
  useEffect(() => {
    callController()
  }, [])
  return (
    <div>
      <h1>{pluginId}&apos;s HomePage</h1>
      <p>Happy coding</p>
    </div>
  )
}

export default memo(HomePage)
