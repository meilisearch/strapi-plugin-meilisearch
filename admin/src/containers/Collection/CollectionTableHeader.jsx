import React, { memo } from 'react'
import {
  Th,
  Thead,
  Tr,
  Typography,
  VisuallyHidden,
} from '@strapi/design-system'
import { useI18n } from '../../Hooks/useI18n'
// import { CheckPermissions } from '@strapi/helper-plugin'
import { PERMISSIONS } from '../../constants'

const CollectionTableHeader = () => {
  const { i18n } = useI18n()
  return (
    <Thead>
      <Tr>
        {/* <CheckPermissions permissions={PERMISSIONS.createAndDelete}> */}
          <Th>
            <VisuallyHidden>INDEX</VisuallyHidden>
          </Th>
        {/* </CheckPermissions> */}
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
        {/* <CheckPermissions permissions={PERMISSIONS.update}> */}
          <Th>
            <VisuallyHidden>Actions</VisuallyHidden>
          </Th>
        {/* </CheckPermissions> */}
      </Tr>
    </Thead>
  )
}

export default memo(CollectionTableHeader)
