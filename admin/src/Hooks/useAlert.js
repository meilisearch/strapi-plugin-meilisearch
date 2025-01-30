import { useNotification } from '@strapi/strapi/admin'
import { useI18n } from './useI18n'

export function useAlert() {
  const { toggleNotification } = useNotification()
  const { i18n } = useI18n()

  /**
   * @param  {object} options
   * @param  {string} [options.type='info']
   * @param  {string} [options.message='SomethingoccurredinMeilisearch']
   * @param  {object} [options.link]
   * @param  {boolean} [options.blockTransition]
   */
  function handleNotification({
    type = 'info',
    message = i18n(
      'plugin.message.something',
      'Something occurred in Meilisearch',
    ),
    link,
    blockTransition = true,
    title,
  }) {
    toggleNotification({
      // optional
      title,
      // required
      // type: 'info|success|warning',
      type,
      // required
      message: i18n('notification.meilisearch.message', message),
      // optional
      link,
      // optional: default = false
      blockTransition,
      // optional
      onClose: () => localStorage.setItem('STRAPI_UPDATE_NOTIF', 'true'),
    })
  }

  const checkForbiddenError = ({ response }) => {
    const status = response?.data?.error?.status
    if (status && status === 403) {
      handleNotification({
        title: i18n('plugin.message.forbidden.title', 'Forbidden'),
        type: 'warning',
        message: i18n(
          'plugin.message.forbidden.description',
          'You do not have permission to do this action',
        ),
        blockTransition: false,
      })
    }
  }

  return {
    handleNotification,
    checkForbiddenError,
  }
}

export default useAlert
