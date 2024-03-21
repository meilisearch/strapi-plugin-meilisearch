import React, { memo } from 'react'
import {
  BaseCheckbox,
  Box,
  Button,
  Flex,
  Td,
  Tr,
  Typography,
} from '@strapi/design-system'
import { CheckPermissions } from '@strapi/helper-plugin'
import { PERMISSIONS } from '../../constants'

const CollectionColumn = ({
  entry,
  deleteCollection,
  addCollection,
  updateCollection,
}) => {
  return (
    <Tr key={entry.contentType}>
      <CheckPermissions permissions={PERMISSIONS.createAndDelete}>
        <Td>
          <BaseCheckbox
            aria-label={`Select ${entry.collection}`}
            onValueChange={() => {
              if (entry.indexed)
                deleteCollection({ contentType: entry.contentType })
              else addCollection({ contentType: entry.contentType })
            }}
            value={entry.indexed}
          />
        </Td>
      </CheckPermissions>
      {/* // Name */}
      <Td>
        <Typography textColor="neutral800">{entry.collection}</Typography>
      </Td>
      {/* // IN MEILISEARCH */}
      <Td>
        <Typography textColor="neutral800">
          {entry.indexed ? 'Yes' : 'No'}
        </Typography>
      </Td>
      {/* // INDEXING */}
      <Td>
        <Typography textColor="neutral800">
          {entry.isIndexing ? 'Yes' : 'No'}
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
      <CheckPermissions permissions={PERMISSIONS.update}>
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
                  Update
                </Button>
              )}
            </Box>
          </Flex>
        </Td>
      </CheckPermissions>
    </Tr>
  )
}

export default memo(CollectionColumn)
