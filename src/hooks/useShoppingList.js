import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAllLists,
  saveList,
  deleteList,
  createEmptyList,
  enqueueSync,
  getSyncQueue,
  clearSyncQueue,
} from '../db'
import { mergeLists, parseShareFromLocation, decodeListFromUrl } from '../utils/listShare'
import { updateAppBadge } from '../utils/badging'
import {
  broadcastListUpdate,
  subscribeListUpdates,
  registerBackgroundSync,
  processSyncQueue,
  notifyListUpdated,
} from '../sync'

export const CATEGORIES = [
  'Hortifruti',
  'Laticínios',
  'Carnes',
  'Padaria',
  'Bebidas',
  'Limpeza',
  'Outros',
]

export const UNITS = ['un', 'kg', 'g', 'L', 'ml', 'pct']

function createItem(name, quantity = 1, unit = 'un', category = 'Outros') {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    quantity,
    unit,
    category,
    checked: false,
    addedAt: now,
    updatedAt: now,
  }
}

export function useShoppingList(isOnline) {
  const [lists, setLists] = useState([])
  const [activeListId, setActiveListId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [importNotice, setImportNotice] = useState(null)
  const initialized = useRef(false)

  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? null

  const persistList = useCallback(async (list, { skipBroadcast = false, skipQueue = false } = {}) => {
    const updated = { ...list, updatedAt: Date.now() }
    await saveList(updated)

    setLists([updated])
    setActiveListId(updated.id)

    if (!skipBroadcast) {
      broadcastListUpdate(updated)
    }

    if (!isOnline && !skipQueue) {
      await enqueueSync({ type: 'save-list', list: updated })
      await registerBackgroundSync()
    }

    const pending = updated.items.filter((i) => !i.checked).length
    await updateAppBadge(pending)

    return updated
  }, [isOnline])

  const loadLists = useCallback(async () => {
    let all = await getAllLists()
    let primary = all.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null

    const { shared } = parseShareFromLocation()
    if (shared) {
      if (primary) {
        primary = mergeLists(primary, shared)
        await saveList(primary)
        setImportNotice(`"${primary.name}" atualizada`)
      } else {
        const now = Date.now()
        primary = {
          id: crypto.randomUUID(),
          name: shared.name || 'Mercado',
          shareCode: shared.shareCode,
          items: shared.items,
          createdAt: now,
          updatedAt: shared.updatedAt ?? now,
          pendingSync: false,
        }
        await saveList(primary)
        setImportNotice(`"${primary.name}" importada`)
      }
    }

    if (!primary) {
      primary = createEmptyList('Mercado')
      await saveList(primary)
    }

    for (const extra of all) {
      if (extra.id !== primary.id) await deleteList(extra.id)
    }

    setLists([primary])
    setActiveListId(primary.id)
    setLoading(false)

    const pending = primary.items.filter((i) => !i.checked).length
    await updateAppBadge(pending)
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    loadLists()
  }, [loadLists])

  useEffect(() => {
    return subscribeListUpdates(async (remoteList) => {
      if (remoteList.id === activeListId) {
        setLists([remoteList])
        const pending = remoteList.items.filter((i) => !i.checked).length
        await updateAppBadge(pending)
        await notifyListUpdated(remoteList.name, pending)
      }
    })
  }, [activeListId])

  useEffect(() => {
    if (!isOnline) return

    const runSync = async () => {
      const currentLists = await getAllLists()
      const result = await processSyncQueue(currentLists, saveList, getSyncQueue, clearSyncQueue)
      if (result.processed > 0) {
        const primary = result.lists.sort((a, b) => b.updatedAt - a.updatedAt)[0]
        if (primary) {
          setLists([primary])
          setActiveListId(primary.id)
          await notifyListUpdated(primary.name, primary.items.filter((i) => !i.checked).length)
        }
      }
    }

    runSync()
  }, [isOnline, activeListId])

  const addItem = useCallback(async (name, quantity, unit, category) => {
    if (!activeList || !name.trim()) return
    const item = createItem(name, quantity, unit, category)
    await persistList({ ...activeList, items: [...activeList.items, item] })
  }, [activeList, persistList])

  const toggleItem = useCallback(async (itemId) => {
    if (!activeList) return
    const items = activeList.items.map((i) =>
      i.id === itemId ? { ...i, checked: !i.checked, updatedAt: Date.now() } : i
    )
    await persistList({ ...activeList, items })
  }, [activeList, persistList])

  const removeItem = useCallback(async (itemId) => {
    if (!activeList) return
    await persistList({ ...activeList, items: activeList.items.filter((i) => i.id !== itemId) })
  }, [activeList, persistList])

  const editItem = useCallback(async (itemId, updates) => {
    if (!activeList) return
    const items = activeList.items.map((i) =>
      i.id === itemId ? { ...i, ...updates, updatedAt: Date.now() } : i
    )
    await persistList({ ...activeList, items })
  }, [activeList, persistList])

  const clearChecked = useCallback(async () => {
    if (!activeList) return
    await persistList({ ...activeList, items: activeList.items.filter((i) => !i.checked) })
  }, [activeList, persistList])

  const renameList = useCallback(async (name) => {
    if (!activeList) return
    await persistList({ ...activeList, name })
  }, [activeList, persistList])

  const importSharedList = useCallback(async (encodedOrUrl) => {
    if (!activeList) return false

    let encoded = encodedOrUrl.trim()
    try {
      const url = new URL(encoded)
      encoded = url.searchParams.get('share') ?? ''
    } catch {
      // not a URL
    }

    const shared = decodeListFromUrl(encoded)
    if (!shared) return false

    const merged = mergeLists(activeList, shared)
    await persistList(merged)
    setImportNotice(`"${merged.name}" atualizada`)
    return true
  }, [activeList, persistList])

  const dismissNotice = useCallback(() => setImportNotice(null), [])

  return {
    activeList,
    loading,
    importNotice,
    dismissNotice,
    addItem,
    toggleItem,
    removeItem,
    editItem,
    clearChecked,
    renameList,
    importSharedList,
  }
}
