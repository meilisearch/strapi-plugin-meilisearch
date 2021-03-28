export function errorNotifications ({ message, link }) {
  strapi.notification.toggle({
    title,
    type: 'warning',
    message: message,
    ...(link && { link: { url: link, label: 'learn more' } }),
    blockTransition: true // The user has to close the error notification manually
  })
}

export function successNotification({ message, duration = 4000, link }) {
  strapi.notification.toggle({
    type: 'success',
    message: message,
    ...(link && { link: { url: link, label: 'learn more' } }),
    timeout: duration
  })
}
