import React, { memo } from 'react'
import {
  Checkbox,
  Box,
  Button,
  Flex,
  Td,
  Tr,
  Typography,
} from '@strapi/design-system'
import { useRBAC } from '@strapi/strapi/admin'

import { useI18n } from '../../Hooks/useI18n'
import { PERMISSIONS } from '../../constants'

const CollectionColumn = ({
  entry,
  deleteCollection,
  addCollection,
  updateCollection,
}) => {
  const { i18n } = useI18n()
  const {
    allowedActions: { canCreate, canUpdate, canDelete },
  } = useRBAC(PERMISSIONS.collections)

  return (
    <Tr key={entry.contentType}>
      {(canCreate || canDelete) && (
        <Td>
          <Checkbox
            aria-label={`Select ${entry.collection}`}
            onCheckedChange={() => {
              if (entry.indexed)
                deleteCollection({ contentType: entry.contentType })
              else addCollection({ contentType: entry.contentType })
            }}
            checked={entry.indexed}
          />
        </Td>
      )}
      {/* // Name */}
      <Td>
        <Typography textColor="neutral800">{entry.collection}</Typography>
      </Td>
      {/* // IN MEILISEARCH */}
      <Td>
        <Typography textColor="neutral800">
          {entry.indexed
            ? i18n('plugin.table.td.yes', 'Yes')
            : i18n('plugin.table.td.no', 'No')}
        </Typography>
      </Td>
      {/* // INDEXING */}
      <Td>
        <Typography textColor="neutral800">
          {entry.isIndexing
            ? i18n('plugin.table.td.yes', 'Yes')
            : i18n('plugin.table.td.no', 'No')}
        </Typography>
      </Td>
      {/* // INDEX NAME */}
      <Td>
        <Typography textColor="neutral800">{entry.indexUid}</Typography>
      </Td>
      {/* // DOCUMENTS */}
      <Td>
        <Typography textColor="neutral800">
          {entry.numberOfDocuments} / {entry.numberOfEntries}
        </Typography>
      </Td>
      {/* // HOOKS */}
      <Td>
        <Typography textColor="neutral800">{entry.reloadNeeded}</Typography>
      </Td>
      {canUpdate && (
        <Td>
          <Flex>
            <Box paddingLeft={1}>
              {entry.indexed && (
                <Button
                  onClick={() =>
                    updateCollection({ contentType: entry.contentType })
                  }
                  size="S"
                  variant="secondary"
                >
                  {i18n('plugin.update', 'Update')}
                </Button>
              )}
            </Box>
          </Flex>
        </Td>
      )}
    </Tr>
  )
}

export default memo(CollectionColumn)
