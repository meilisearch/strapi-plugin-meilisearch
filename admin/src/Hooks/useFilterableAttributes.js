import { useState } from 'react'
import { useFetchClient } from '@strapi/strapi/admin'
import pluginId from '../pluginId'
import useAlert from './useAlert'
/**
 * A custom hook to manage filterable attributes for a given content type in the Meilisearch plugin.
 *
 * @returns {{
 *   fields: Array<{ name: string, type: string }>,
 *   selected: string[],
 *   loading: boolean,
 *   fetchError: boolean,
 *   fetchFields: (params: { contentType: string, indexUid: string }) => Promise<void>,
 *   saveFilterableAttributes: (params: { indexUid: string, contentType: string }) => Promise<void>,
 *   toggleField: (fieldName: string) => void,
 * }} The current state and the actions to read and update it.
 *
 */
export function useFilterableAttributes() {
  const [fields, setFields] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const { handleNotification, checkForbiddenError } = useAlert()
  const { get, post } = useFetchClient()

  /**
   * Fetch the fields and existing filterable attributes for a given content type and index.
   *
   * @param {{ contentType: string, indexUid: string }} param0 - The content type and index UID.
   */
  const fetchFields = async ({ contentType, indexUid }) => {
    setLoading(true)
    setFetchError(false)
    try {
      const [
        {
          data: { data: fields },
        },
        {
          data: { data: existing },
        },
      ] = await Promise.all([
        get(
          `/${pluginId}/content-type-fields/${encodeURIComponent(contentType)}`,
        ),
        get(
          `/${pluginId}/filterable-attributes/${encodeURIComponent(indexUid)}`,
        ),
      ])
      setFields(fields || [])
      setSelected(existing || [])
    } catch (error) {
      setFetchError(true)
      checkForbiddenError(error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Save the filterable attributes for a given index and content type.
   *
   * @param {{ indexUid: string, contentType: string }} param0 - The index UID and content type.
   */
  const saveFilterableAttributes = async ({ indexUid, contentType }) => {
    try {
      const { data } = await post(
        `/${pluginId}/filterable-attributes/${indexUid}`,
        { filterableAttributes: selected, contentType },
      )
      if (data?.error) {
        handleNotification({
          type: 'warning',
          message: data.error.message,
          blockTransition: false,
        })
      } else {
        handleNotification({
          type: 'success',
          message: 'Filterable attributes updated successfully',
          blockTransition: false,
        })
      }
    } catch (error) {
      checkForbiddenError(error)
      if (error?.status !== 403) {
        handleNotification({
          type: 'warning',
          message: 'Failed to update the filterable attributes',
          blockTransition: false,
        })
      }
    }
  }

  /**
   * Toggle the selection of a field.
   *
   * @param {string} fieldName - The name of the field to toggle.
   */
  const toggleField = fieldName => {
    setSelected(prev =>
      prev.includes(fieldName)
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName],
    )
  }

  return {
    fields,
    selected,
    loading,
    fetchError,
    fetchFields,
    saveFilterableAttributes,
    toggleField,
  }
}

export default useFilterableAttributes
