import { useNotification } from '@strapi/helper-plugin'

export function useAlert() {
  const toggleNotification = useNotification() // HERE
  /**
   * @param  {object} options
   * @param  {string} [options.type='info']
   * @param  {string} [options.message='SomethingoccuredinMeilisearch']
   * @param  {object} [options.link]
   * @param  {boolean} [options.blockTransition]
   */
  const handleNotification = ({
    type = 'info',
    message = 'Something occured in Meilisearch',
    link,
    blockTransition = true,
    title,
  }) => {
    toggleNotification({
      // optional
      title,
      // required
      // type: 'info|success|warning',
      type,
      // required
      message: {
        id: 'notification.meilisearch.message',
        defaultMessage: message,
      },
      // optional
      link,
      // optional: default = false
      blockTransition,
      // optional
      onClose: () => localStorage.setItem('STRAPI_UPDATE_NOTIF', true),
    })
  }

  const checkForbiddenError = ({ response }) => {
    const status = response?.payload?.error?.status
    if (status && status === 403) {
      handleNotification({
        title: 'Forbidden',
        type: 'warning',
        message: 'You do not have permission to do this action',
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
