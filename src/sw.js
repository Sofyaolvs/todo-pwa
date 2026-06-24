import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

const SYNC_TAG = 'shopping-list-sync'

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(
      self.registration.showNotification('voltou a internet', {
        body: 'alterações salvas',
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [100, 50, 100],
        tag: 'sync-complete',
        renotify: true,
        data: { url: '/?app=1' },
      })
    )
  }
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Lista de Compras', body: 'A lista foi atualizada' }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200],
      data: { url: '/?app=1' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ('focus' in client) return client.focus()
        }
        return clients.openWindow(event.notification.data?.url ?? '/?app=1')
      })
  )
})
