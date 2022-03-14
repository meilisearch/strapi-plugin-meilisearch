import { Box } from '@strapi/design-system/Box'
import React, { memo } from 'react'
import { TextInput } from '@strapi/design-system/TextInput'
import { Button } from '@strapi/design-system/Button'
import { useCredential } from '../../Hooks/useCredential'

const Credentials = () => {
  const {
    host,
    apiKey,
    credentials,
    setHost,
    setApiKey,
    updateCredentials,
  } = useCredential()

  return (
    <Box>
      <Box padding={2}>
        <TextInput
          placeholder="Host"
          label="Meilisearch Host"
          name="host"
          hint="The host on which your Meilisearch is running"
          value={host}
          onChange={e => setHost(e.target.value)}
          disabled={credentials.HostIsFromConfigFile}
        />
      </Box>
      <Box padding={2}>
        <TextInput
          placeholder="API key"
          label="Meilisearch API Key"
          name="apiKey"
          hint="Your secret key. ⚠️ This key is not meant to be used for searching!"
          onChange={e => setApiKey(e.target.value)}
          value={apiKey}
          disabled={credentials.ApiKeyIsFromConfigFile}
          aria-label="Password"
          type="password"
        />
      </Box>
      <Box paddingTop={2} paddingLeft={2} paddingRight={2} paddingBottom={2}>
        <Button
          variant="secondary"
          onClick={() => updateCredentials()}
          disabled={
            credentials.ApiKeyIsFromConfigFile &&
            credentials.HostIsFromConfigFile
          }
        >
          Save
        </Button>
      </Box>
    </Box>
  )
}

export default memo(Credentials)
