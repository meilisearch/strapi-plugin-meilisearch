import { useIntl } from 'react-intl'
import pluginId from '../pluginId'

export const useI18n = () => {
  const { formatMessage } = useIntl()

  const i18n = (key, defaultMessage) => {
    return formatMessage({
      id: `${pluginId}.${key}`,
      defaultMessage,
    })
  }

  return {
    i18n,
  }
}
