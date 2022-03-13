import React, { memo } from 'react'
import { Thead, Tr, Th } from '@strapi/design-system/Table'
import { BaseCheckbox } from '@strapi/design-system/BaseCheckbox'
import { Typography } from '@strapi/design-system/Typography'
import { VisuallyHidden } from '@strapi/design-system/VisuallyHidden'

const CollectionTableHeader = () => {
  return (
    <Thead>
      <Tr>
        <Th>
          <BaseCheckbox aria-label="Select all entries" />
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
