import { memo, useEffect, useState } from 'react'
import { Box, Button, Table, Tbody } from '@strapi/design-system'
// import { request, useAutoReloadOverlayBlocker } from '@strapi/helper-plugin'
import { PLUGIN_ID } from 'src/pluginId'
import { useI18n } from 'src/hooks/useI18n'
import useCollection from 'src/hooks/useCollection'
import { useFetchClient } from '@strapi/admin/strapi-admin'
import CollectionTableHeader from './CollectionTableHeader'
import CollectionColumn from './CollectionColumn'

const Collection = () => {
  const {
    collections,
    deleteCollection,
    addCollection,
    updateCollection,
    reloadNeeded,
    refetchCollection,
  } = useCollection()
//   const { lockAppWithAutoreload, unlockAppWithAutoreload } =
//     useAutoReloadOverlayBlocker() // TODO
  const [reload, setReload] = useState(false)
  const { get, del, post, put } = useFetchClient();

  const { i18n } = useI18n()

  const ROW_COUNT = 6
  const COL_COUNT = 10

  /**
   * Reload the servers and wait for the server to be reloaded.
   */
  const reloadServer = async () => {
    try {
    //   lockAppWithAutoreload()
      await get(
        `/${PLUGIN_ID}/reload`,
      )
      setReload(false)
    } catch (err) {
      console.error(err)
    } finally {
    //   unlockAppWithAutoreload()
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