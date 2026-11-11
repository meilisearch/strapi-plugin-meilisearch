import { Alert, Box, Button, Table, Tbody } from '@strapi/design-system'
import {
  private_useAutoReloadOverlayBlocker,
  useFetchClient,
} from '@strapi/strapi/admin'

import React, { memo, useEffect, useState } from 'react'

import useCollection from '../../Hooks/useCollection'
import { useI18n } from '../../Hooks/useI18n'
import pluginId from '../../pluginId'
import CollectionColumn from './CollectionColumn'
import CollectionTableHeader from './CollectionTableHeader'
import { serverRestartWatcher } from '../../utils/serverRestartWatcher'

const Collection = () => {
  const {
    collections,
    deleteCollection,
    addCollection,
    updateCollection,
    reloadNeeded,
    meilisearchUnreachable,
    refetchCollection,
  } = useCollection()
  const { lockAppWithAutoreload, unlockAppWithAutoreload } =
    private_useAutoReloadOverlayBlocker()
  const { get } = useFetchClient()

  const [reload, setReload] = useState(false)
  const [unreachableDismissed, setUnreachableDismissed] = useState(false)

  const { i18n } = useI18n()

  const ROW_COUNT = 6
  const COL_COUNT = 10

  /**
   * Reload the servers and wait for the server to be reloaded.
   */
  const reloadServer = async () => {
    try {
      lockAppWithAutoreload()
      await get(`/${pluginId}/reload`, true)
      await serverRestartWatcher(true)
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

  // The Alert always renders a close button, so it is only hidden until the
  // next fetch (`collections` gets a new reference on every successful fetch).
  useEffect(() => {
    setUnreachableDismissed(false)
  }, [collections])

  return (
    <Box background="neutral100">
      {meilisearchUnreachable && !unreachableDismissed && (
        <Box paddingBottom={4}>
          <Alert
            variant="warning"
            title={i18n(
              'plugin.message.meilisearch-unreachable.title',
              'Meilisearch is unreachable',
            )}
            closeLabel={i18n(
              'plugin.message.meilisearch-unreachable.close',
              'Close',
            )}
            onClose={() => setUnreachableDismissed(true)}
          >
            {i18n(
              'plugin.message.meilisearch-unreachable.body',
              'Indexed collections are kept. Index status and document counts are unknown until Meilisearch is reachable.',
            )}
          </Alert>
        </Box>
      )}
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
