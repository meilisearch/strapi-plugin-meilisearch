import { Box, Button, Table, Tbody } from '@strapi/design-system'
import {
  // private_useAutoReloadOverlayBlocker,
  useFetchClient,
} from '@strapi/strapi/admin'

import React, { memo, useEffect, useState } from 'react'

import useCollection from '../../Hooks/useCollection'
import { useI18n } from '../../Hooks/useI18n'
import pluginId from '../../pluginId'
import CollectionColumn from './CollectionColumn'
import CollectionTableHeader from './CollectionTableHeader'

const Collection = () => {
  const {
    collections,
    deleteCollection,
    addCollection,
    updateCollection,
    reloadNeeded,
    refetchCollection,
  } = useCollection()
  // const { lockAppWithAutoreload, unlockAppWithAutoreload } =
  //   private_useAutoReloadOverlayBlocker()
  const { get } = useFetchClient()

  const [reload, setReload] = useState(false)

  const { i18n } = useI18n()

  const ROW_COUNT = 6
  const COL_COUNT = 10

  /**
   * Reload the servers and wait for the server to be reloaded.
   */
  const reloadServer = async () => {
    try {
      // lockAppWithAutoreload()
      await get(`/${pluginId}/reload`, true)
      setReload(false)
    } catch (err) {
      console.error(err)
    } finally {
      // unlockAppWithAutoreload()
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
      {reloadNeeded && (
        <Box padding={5}>
          <Button onClick={() => setReload(true)}>
            {i18n('plugin.reload-server', 'Reload server')}
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default memo(Collection)
