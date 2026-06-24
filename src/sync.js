const CHANNEL_NAME = 'shopping-list-sync'
const SYNC_TAG = 'shopping-list-sync'

let channel = null

function getChannel() {
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME)
  }
  return channel
}

export function broadcastListUpdate(list) {
  getChannel()?.postMessage({ type: 'list-updated', list, at: Date.now() })
}

export function subscribeListUpdates(onUpdate) {
  const ch = getChannel()
  if (!ch) return () => {}

  const handler = (event) => {
    if (event.data?.type === 'list-updated') {
      onUpdate(event.data.list)
    }
  }
  ch.addEventListener('message', handler)
  return () => ch.removeEventListener('message', handler)
}

export async function registerBackgroundSync() {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return false
  try {
    const reg = await navigator.serviceWorker.ready
    await reg.sync.register(SYNC_TAG)
    return true
  } catch {
    return false
  }
}

export async function processSyncQueue(lists, saveList, getSyncQueue, clearSyncQueue) {
  const queue = await getSyncQueue()
  if (queue.length === 0) return { processed: 0, lists }

  let updatedLists = [...lists]
  for (const op of queue) {
    if (op.type === 'save-list') {
      const idx = updatedLists.findIndex((l) => l.id === op.list.id)
      if (idx >= 0) {
        updatedLists[idx] = { ...op.list, pendingSync: false }
      } else {
        updatedLists.push({ ...op.list, pendingSync: false })
      }
      await saveList({ ...op.list, pendingSync: false })
    }
  }

  await clearSyncQueue()
  return { processed: queue.length, lists: updatedLists }
}

export async function sendTestNotification() {
  if (!('Notification' in window)) {
    return { ok: false, reason: 'unsupported' }
  }

  let permission = Notification.permission
  if (permission !== 'granted') {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') {
    return { ok: false, reason: permission }
  }

  const options = {
    body: 'Se você está vendo isto, as notificações funcionam ✅',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    tag: 'test-notification',
    data: { url: '/?app=1' },
  }

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification('Notificação de teste', options)
  } else {
    new Notification('Notificação de teste', options)
  }
  return { ok: true }
}

export async function notifyListUpdated(listName, pendingCount) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification(listName, {
    body: pendingCount > 0
      ? `${pendingCount} ${pendingCount === 1 ? 'item' : 'itens'} na lista`
      : 'lista completa',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    tag: 'list-update',
    data: { url: '/?app=1' },
  })
}

export { SYNC_TAG }
