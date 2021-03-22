export function errorNotifications ({ message, link, duration = 4000 }) {
  strapi.notification.toggle({
    title: 'Operation on MeiliSearch failed',
    type: 'warning',
    message: message,
    ...(link ? { link: { url: link, label: 'more information' } } : {}),
    timeout: duration
  })
}

export function successNotification ({ message, duration = 4000, link }) {
  strapi.notification.toggle({
    type: 'success',
    message: message,
    ...(link ? { link: { url: link, label: 'more information' } } : {}),
    timeout: duration
  })
}
