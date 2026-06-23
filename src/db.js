const DB_NAME = 'shopping-pwa'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('lists')) {
        const store = db.createObjectStore('lists', { keyPath: 'id' })
        store.createIndex('shareCode', 'shareCode', { unique: false })
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export async function getAllLists() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('lists', 'readonly').objectStore('lists').getAll()
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror = () => reject(req.error)
  })
}

export async function getList(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('lists', 'readonly').objectStore('lists').get(id)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function getListByShareCode(shareCode) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('lists', 'readonly').objectStore('lists').index('shareCode').get(shareCode)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function saveList(list) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('lists', 'readwrite').objectStore('lists').put(list)
    req.onsuccess = () => resolve(list)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteList(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('lists', 'readwrite').objectStore('lists').delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function enqueueSync(op) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('syncQueue', 'readwrite').objectStore('syncQueue').add({
      ...op,
      createdAt: Date.now(),
    })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getSyncQueue() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction('syncQueue', 'readonly').objectStore('syncQueue').getAll()
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror = () => reject(req.error)
  })
}

export async function clearSyncQueue() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite')
    tx.objectStore('syncQueue').clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function createEmptyList(name = 'Compras') {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name,
    shareCode: generateShareCode(),
    items: [],
    createdAt: now,
    updatedAt: now,
    pendingSync: false,
  }
}
