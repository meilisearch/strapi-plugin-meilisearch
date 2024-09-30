import { memo } from 'react'
import {
  BaseCheckbox,
  Box,
  Button,
  Flex,
  Td,
  Tr,
  Typography,
} from '@strapi/design-system'
import { Page } from '@strapi/strapi/admin';
import { PERMISSIONS } from '../../constants'
import { useI18n } from 'src/hooks/useI18n'

const CollectionColumn = ({
  entry,
  deleteCollection,
  addCollection,
  updateCollection,
}) => {
  const { i18n } = useI18n()
  return (
    <Tr key={entry.contentType}>
      <Page.Protect permissions={PERMISSIONS.createAndDelete}>
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
      </Page.Protect>
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
      <Page.Protect permissions={PERMISSIONS.update}>
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
      </Page.Protect>
    </Tr>
  )
}

export default memo(CollectionColumn)