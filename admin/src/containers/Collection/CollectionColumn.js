import React, { memo } from 'react'
import { Tr, Td } from '@strapi/design-system/Table'
import { BaseCheckbox } from '@strapi/design-system/BaseCheckbox'
import { Typography } from '@strapi/design-system/Typography'
import { Flex } from '@strapi/design-system/Flex'
import { Box } from '@strapi/design-system/Box'
import { Button } from '@strapi/design-system/Button'

const CollectionColumn = ({
  entry,
  deleteCollection,
  addCollection,
  updateCollection,
}) => {
  return (
    <Tr key={entry.contentType}>
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
      <Td>
        <Flex>
          <Box paddingLeft={1}>
            <Button
              onClick={() =>
                updateCollection({ contentType: entry.contentType })
              }
              size="S"
              variant="secondary"
            >
              Update
            </Button>
          </Box>
        </Flex>
      </Td>
    </Tr>
  )
}

export default memo(CollectionColumn)
