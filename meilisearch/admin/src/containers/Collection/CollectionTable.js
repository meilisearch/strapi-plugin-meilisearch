import React, { memo, useEffect, useState } from 'react'
import { Table, Tbody } from '@strapi/design-system/Table'
import { Box } from '@strapi/design-system/Box'
import { Button } from '@strapi/design-system/Button'
import { request, useAutoReloadOverlayBlocker } from '@strapi/helper-plugin'
import CollectionTableHeader from './CollectionTableHeader'
import CollectionColumn from './CollectionColumn'
import useCollectionReloader from '../Hooks/useCollectionReloader'
import pluginId from '../../pluginId'

const Collection = () => {
  const {
    collections,
    deleteCollection,
    addCollection,
    updateCollection,
    reloadNeeded,
    refetchCollection,
  } = useCollectionReloader()
  const {
    lockAppWithAutoreload,
    unlockAppWithAutoreload,
  } = useAutoReloadOverlayBlocker()
  const [reload, setReload] = useState(false)

  const ROW_COUNT = 6
  const COL_COUNT = 10

  /**
   * Reload the servers and wait for the server to be reloaded.
   */
  const reloadServer = async () => {
    try {
      lockAppWithAutoreload()
      await request(
        `/${pluginId}/reload`,
        {
          method: 'GET',
        },
        true
      )
      setReload(false)
    } catch (err) {
      console.error(err)
    } finally {
      unlockAppWithAutoreload()
      refetchCollection()
    }
  }

  useEffect(() => {
    if (reload) reloadServer()
  }, [reload])
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
      {/* TODO: align right */}
      {reloadNeeded && (
        <Box padding={5} textAlign="right">
          <Button onClick={() => setReload(true)}>Reload server</Button>
        </Box>
      )}
    </Box>
  )
}

export default memo(Collection)
