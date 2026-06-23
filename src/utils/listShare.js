export function encodeListForUrl(list) {
  const payload = {
    v: 1,
    name: list.name,
    shareCode: list.shareCode,
    items: list.items,
    updatedAt: list.updatedAt,
  }
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeListFromUrl(encoded) {
  if (!encoded) return null
  try {
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const binary = atob(b64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    const data = JSON.parse(json)
    if (!data?.shareCode || !Array.isArray(data.items)) return null
    return data
  } catch {
    return null
  }
}

export function buildShareUrl(list, origin = window.location.origin) {
  const encoded = encodeListForUrl(list)
  const params = new URLSearchParams({
    app: '1',
    room: list.shareCode,
    share: encoded,
  })
  return `${origin}${window.location.pathname}?${params}`
}

export function parseShareFromLocation(search = window.location.search) {
  const params = new URLSearchParams(search)
  const shareCode = params.get('room')
  const encoded = params.get('share')
  const shared = decodeListFromUrl(encoded)
  if (!shared) return { shareCode, shared: null }
  return { shareCode: shareCode ?? shared.shareCode, shared }
}

export function mergeLists(local, incoming) {
  const itemMap = new Map()

  for (const item of local.items) {
    itemMap.set(item.id, { ...item })
  }

  for (const item of incoming.items) {
    const existing = itemMap.get(item.id)
    if (!existing) {
      itemMap.set(item.id, { ...item })
    } else if (item.updatedAt >= existing.updatedAt) {
      itemMap.set(item.id, { ...item })
    }
  }

  const items = [...itemMap.values()].sort((a, b) => a.addedAt - b.addedAt)
  const updatedAt = Math.max(local.updatedAt, incoming.updatedAt ?? 0, Date.now())

  return {
    ...local,
    name: incoming.name || local.name,
    shareCode: incoming.shareCode || local.shareCode,
    items,
    updatedAt,
    pendingSync: false,
  }
}
