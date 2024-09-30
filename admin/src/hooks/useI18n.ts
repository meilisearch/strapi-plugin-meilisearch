import { useIntl } from 'react-intl'
import { PLUGIN_ID } from 'src/pluginId'

export const useI18n = () => {
  const { formatMessage } = useIntl()

  const i18n = (key, defaultMessage) => {
    return formatMessage({
      id: `${PLUGIN_ID}.${key}`,
      defaultMessage,
    })
  }

  return {
    i18n,
  }
}