import { useNotification } from '@strapi/helper-plugin'

export function useAlert() {
  const toggleNotification = useNotification()
  /**
   * @param  {object} options
   * @param  {string} [options.type='info']
   * @param  {string} [options.message='SomethingoccuredinMeilisearch']
   * @param  {object} [options.link]
   */
  const handleNotification = ({
    type = 'info',
    message = 'Something occured in Meilisearch',
    link,
  }) => {
    toggleNotification({
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
      blockTransition: true,
      // optional
      onClose: () => localStorage.setItem('STRAPI_UPDATE_NOTIF', true),
    })
  }
  return {
    handleNotification,
  }
}

export default useAlert
