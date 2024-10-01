import React, { memo } from 'react'
import {
  Box,
  Button,
  TextInput,
  Typography,
  Field,
} from '@strapi/design-system'
import { useCredential } from '../../Hooks/useCredential'
import { useI18n } from '../../Hooks/useI18n'
// import { CheckPermissions } from '@strapi/helper-plugin'
import { PERMISSIONS } from '../../constants'

const Credentials = () => {
  const { host, apiKey, credentials, setHost, setApiKey, updateCredentials } =
    useCredential()
  const { i18n } = useI18n()
  console.log(host, apiKey)

  return (
    <Box>
      <Box padding={2}>
        <Field.Root
          id="host"
          hint={i18n(
            'plugin.tab.settings.input.url.hint',
            'The URL on which your Meilisearch is running',
          )}
        >
          <Field.Label>
            {i18n('plugin.tab.settings.input.url.label', 'Meilisearch URL')}
          </Field.Label>
          <Field.Input
            type="text"
            name="host"
            value={host}
            placeholder={i18n(
              'plugin.tab.settings.input.url.placeholder',
              'URL',
            )}
            onChange={e => setHost(e.target.value)}
            disabled={credentials.HostIsFromConfigFile}
          />
          <Field.Hint />
        </Field.Root>
      </Box>
      <Box padding={2}>
        <Field.Root
          id="apiKey"
          hint={i18n(
            'plugin.tab.settings.input.apiKey.hint',
            'A valid API key with enough permission to create indexes (or the master key).',
          )}
        >
          <Field.Label>
            {i18n(
              'plugin.tab.settings.input.apiKey.label',
              'Meilisearch API Key',
            )}
          </Field.Label>
          <Field.Input
            type="password"
            name="apiKey"
            placeholder={i18n(
              'plugin.tab.settings.input.apiKey.placeholder',
              'API key',
            )}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            disabled={credentials.ApiKeyIsFromConfigFile}
          />
          <Field.Hint />
        </Field.Root>
      </Box>
      <Box paddingTop={1} paddingLeft={2}>
        <Typography variant="pi" style={{ color: 'red' }}>
          {i18n(
            'plugin.tab.settings.warning.credentials.1',
            'Do not use this API key on your front-end as it has too much rights. Instead, use the public key available using',
          )}{' '}
          <a
            href="https://www.meilisearch.com/docs/reference/api/keys#get-keys"
            target="_blank"
            rel="noreferrer"
          >
            {i18n('plugin.tab.settings.warning.credentials.2', 'the key route')}
          </a>
          .
        </Typography>
      </Box>

      <Box paddingTop={2} paddingLeft={2} paddingRight={2} paddingBottom={2}>
        {/* <CheckPermissions permissions={PERMISSIONS.settingsEdit}> */}
        <Button
          variant="secondary"
          onClick={() => updateCredentials()}
          disabled={
            credentials.ApiKeyIsFromConfigFile &&
            credentials.HostIsFromConfigFile
          }
        >
          {i18n('plugin.save', 'Save')}
        </Button>
        {/* </CheckPermissions> */}
      </Box>
    </Box>
  )
}

export default memo(Credentials)
