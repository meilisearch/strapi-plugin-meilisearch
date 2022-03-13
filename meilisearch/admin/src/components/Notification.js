import React, { memo } from 'react'
import { Alert } from '@strapi/design-system/Alert'

const Notifcation = () => {
  return (
    <Alert closeLabel="Close alert" title="Title">
      This is the default alert.
    </Alert>
  )
}

export default memo(Notifcation)
