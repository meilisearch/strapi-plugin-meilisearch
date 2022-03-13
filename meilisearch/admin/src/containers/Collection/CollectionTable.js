import { Table, Tbody } from '@strapi/design-system/Table'
import { Box } from '@strapi/design-system/Box'
import { Button } from '@strapi/design-system/Button'
import React, { memo } from 'react'
import CollectionTableHeader from './CollectionTableHeader'
import CollectionColumn from './CollectionColumn'
import useCollectionReloader from '../Hooks/useCollectionReloader'

const Collection = () => {
  const {
    collections,
    deleteCollection,
    addCollection,
    updateCollection,
    reloadNeeded,
    reloadServer,
  } = useCollectionReloader()

  const ROW_COUNT = 6
  const COL_COUNT = 10

  return (
    <Box background="neutral100">
      <Table colCount={COL_COUNT} rowCount={ROW_COUNT}>
        <CollectionTableHeader />
        <Tbody>
          {collections.map(collection => (
            <CollectionColumn
              key={collection.collection}
              entry={collection}
              deleteCollection={deleteCollection}
              addCollection={addCollection}
              updateCollection={updateCollection}
            />
          ))}
        </Tbody>
      </Table>
      <Box padding={5} textAlign="right">
        {/* TODO: align right */}
        {reloadNeeded ? (
          <Button onClick={() => reloadServer()}>Reload server</Button>
        ) : (
          ''
        )}
      </Box>
    </Box>
  )
}

export default memo(Collection)
