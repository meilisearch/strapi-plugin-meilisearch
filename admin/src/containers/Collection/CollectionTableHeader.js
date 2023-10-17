import React, { memo } from 'react'
import {
  Th,
  Thead,
  Tr,
  Typography,
  VisuallyHidden,
} from '@strapi/design-system'

const CollectionTableHeader = () => {
  return (
    <Thead>
      <Tr>
        <Th>
          <VisuallyHidden>INDEX</VisuallyHidden>
        </Th>
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
        <Th>
          <VisuallyHidden>Actions</VisuallyHidden>
        </Th>
      </Tr>
    </Thead>
  )
}

export default memo(CollectionTableHeader)
