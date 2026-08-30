import { useState } from 'react'
import { useFetchClient } from '@strapi/strapi/admin'
import pluginId from '../pluginId'
import useAlert from './useAlert'

export function useFilterableAttributes() {
  const [fields, setFields] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const { handleNotification, checkForbiddenError } = useAlert()
  const { get, post } = useFetchClient()

  const fetchFields = async ({ contentType, indexUid }) => {
    setLoading(true)
    try {
      const [{ data: { data: fields } }, { data: { data: existing } }] = await Promise.all([
        get(`/${pluginId}/content-type-fields/${encodeURIComponent(contentType)}`),
        get(`/${pluginId}/filterable-attributes/${encodeURIComponent(indexUid)}`),
      ])
      setFields(fields || [])
      setSelected(existing || [])
    } catch (error) {
      checkForbiddenError(error)
    } finally {
      setLoading(false)
    }
  }

  const saveFilterableAttributes = async ({ indexUid, contentType }) => {
    try {
      const { data } = await post(
        `/${pluginId}/filterable-attributes/${indexUid}`,
        { filterableAttributes: selected, contentType }
      )
      if (data?.error) {
        handleNotification({
          type: 'warning',
          message: data.error.message,
          blockTransition: false
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
    }
  }

  const toggleField = (fieldName) => {
    setSelected(prev =>
      prev.includes(fieldName)
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    )
  }

  return {
    fields,
    selected,
    loading,
    fetchFields,
    saveFilterableAttributes,
    toggleField,
  }
}

export default useFilterableAttributes
