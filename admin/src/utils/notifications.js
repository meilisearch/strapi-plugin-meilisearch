export function errorNotifications ({ message, link }) {
  strapi.notification.toggle({
    title: 'Operation on MeiliSearch failed',
    type: 'warning',
    message: message,
    ...(link ? { link: { url: link, label: 'more information' } } : {}),
    timeout: 4000
  })
}

export function successNotification ({ message }) {
  strapi.notification.toggle({
    type: 'success',
    message: message,
    timeout: 4000
  })
}
