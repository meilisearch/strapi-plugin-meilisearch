import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Typography,
} from '@strapi/design-system'
import { useFilterableAttributes } from '../../Hooks/useFilterableAttributes'

const FilterableAttributesPanel = ({ contentType, indexUid }) => {
  const [expanded, setExpanded] = useState(false)
  const { fields, selected, loading, fetchFields, saveFilterableAttributes, toggleField } =
    useFilterableAttributes()

  useEffect(() => {
    if (expanded && fields.length === 0) {
      fetchFields({ contentType, indexUid })
    }
  }, [expanded])

  return (
    <Box paddingTop={2} paddingBottom={2}>
      <Button
        fullWidth
        style={{ justifyContent: 'flex-start' }}
        variant="ghost"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? '▲' : '▼'} Filterable Attributes
        {selected.length > 0 && ` (${selected.length} selected)`}
      </Button>

      {expanded && (
        <Box paddingTop={3} paddingLeft={2}>
          {loading && <Typography>Loading fields...</Typography>}
          {!loading && fields.length === 0 && (
            <Typography textColor="neutral500">No fields found.</Typography>
          )}
          {fields.map(field => (
            <Box key={field.name} paddingBottom={2}>
              <Checkbox
                checked={selected.includes(field.name)}
                onCheckedChange={() => toggleField(field.name)}
              >
                <Flex gap={2} alignItems="center">
                  <Typography>{field.name}</Typography>
                  <Typography variant="sigma" textColor="neutral500">
                    {field.type}
                  </Typography>
                </Flex>
              </Checkbox>
            </Box>
          ))}
          {!loading && fields.length > 0 && (
            <Box paddingTop={3}>
              <Button
                size="S"
                onClick={() => saveFilterableAttributes({ indexUid, contentType })}
              >
                Save
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default FilterableAttributesPanel
