import React, { memo } from 'react'
import {
  Th,
  Thead,
  Tr,
  Typography,
  VisuallyHidden,
} from '@strapi/design-system'
import { useRBAC } from '@strapi/strapi/admin'

import { useI18n } from '../../Hooks/useI18n'
import { PERMISSIONS } from '../../constants'

const CollectionTableHeader = () => {
  const { i18n } = useI18n()

  const {
    allowedActions: { canCreate, canUpdate, canDelete },
  } = useRBAC(PERMISSIONS.collections)

  return (
    <Thead>
      <Tr>
        {(canCreate || canDelete) && (
          <Th>
            <VisuallyHidden>INDEX</VisuallyHidden>
          </Th>
        )}
        <Th>
          <Typography variant="sigma">
            {i18n('plugin.table.header.name', 'NAME')}
          </Typography>
        </Th>
        <Th>
          <Typography variant="sigma">
            {i18n('plugin.table.header.in-meilisearch', 'IN MEILISEARCH ?')}
          </Typography>
        </Th>
        <Th>
          <Typography variant="sigma">
            {i18n('plugin.table.header.indexing', 'INDEXING ?')}
          </Typography>
        </Th>
        <Th>
          <Typography variant="sigma">
            {i18n('plugin.table.header.index-name', 'INDEX NAME')}
          </Typography>
        </Th>
        <Th>
          <Typography variant="sigma">
            {i18n('plugin.table.header.documents', 'DOCUMENTS')}
          </Typography>
        </Th>
        <Th>
          <Typography variant="sigma">
            {i18n('plugin.table.header.hooks', 'HOOKS')}
          </Typography>
        </Th>
        {canUpdate && (
          <Th>
            <VisuallyHidden>Actions</VisuallyHidden>
          </Th>
        )}
      </Tr>
    </Thead>
  )
}

export default memo(CollectionTableHeader)
