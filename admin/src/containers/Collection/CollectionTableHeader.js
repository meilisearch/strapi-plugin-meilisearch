import React, { memo } from 'react'
import {
  Th,
  Thead,
  Tr,
  Typography,
  VisuallyHidden,
} from '@strapi/design-system'
import { CheckPermissions } from '@strapi/helper-plugin'
import { PERMISSIONS } from '../../constants'

const CollectionTableHeader = () => {
  return (
    <Thead>
      <Tr>
        <CheckPermissions permissions={PERMISSIONS.createAndDelete}>
          <Th>
            <VisuallyHidden>INDEX</VisuallyHidden>
          </Th>
        </CheckPermissions>
        <Th>
          <Typography variant="sigma">NAME</Typography>
        </Th>
        <Th>
          <Typography variant="sigma">IN MEILISEARCH ?</Typography>
        </Th>
        <Th>
          <Typography variant="sigma">INDEXING ?</Typography>
        </Th>
        <Th>
          <Typography variant="sigma">INDEX NAME</Typography>
        </Th>
        <Th>
          <Typography variant="sigma">DOCUMENTS</Typography>
        </Th>
        <Th>
          <Typography variant="sigma">HOOKS</Typography>
        </Th>
        <CheckPermissions permissions={PERMISSIONS.update}>
          <Th>
            <VisuallyHidden>Actions</VisuallyHidden>
          </Th>
        </CheckPermissions>
      </Tr>
    </Thead>
  )
}

export default memo(CollectionTableHeader)
