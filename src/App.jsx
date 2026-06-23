import { useState, useEffect, useRef } from 'react'
import './App.css'
import LandingPage from './LandingPage'
import SharePanel from './components/SharePanel'
import { useShoppingList, CATEGORIES, UNITS } from './hooks/useShoppingList'

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    new URLSearchParams(window.location.search).has('app')
  )
}

function App() {
  const [standalone, setStandalone] = useState(isStandaloneMode)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showShare, setShowShare] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('un')
  const [category, setCategory] = useState('Outros')

  const {
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
  } = useShoppingList(isOnline)

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const onChange = (e) => { if (e.matches) setStandalone(true) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const shareTargetHandled = useRef(false)

  useEffect(() => {
    if (shareTargetHandled.current || !activeList || !standalone) return
    const params = new URLSearchParams(window.location.search)
    const sharedText = params.get('text') || params.get('title')
    if (!sharedText) return
    shareTargetHandled.current = true
    addItem(sharedText, 1, 'un', 'Outros')
    params.delete('text')
    params.delete('title')
    params.delete('url')
    const qs = params.toString()
    window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname)
  }, [activeList, standalone, addItem])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setStandalone(true)
    }
  }

  const handleAddItem = async () => {
    const q = parseFloat(quantity) || 1
    await addItem(name, q, unit, category)
    setName('')
    setQuantity('1')
  }

  const startEditTitle = () => {
    setTitleDraft(activeList?.name ?? '')
    setEditingTitle(true)
  }

  const saveTitle = async () => {
    const trimmed = titleDraft.trim()
    if (trimmed && activeList) await renameList(trimmed)
    setEditingTitle(false)
  }

  if (!standalone) {
    return (
      <LandingPage
        installPrompt={installPrompt}
        onInstall={handleInstall}
      />
    )
  }

  if (loading) {
    return (
      <div className="app">
        <div className="app-header" />
        <div className="sheet sheet--loading">Carregando…</div>
      </div>
    )
  }

  const filteredItems = (activeList?.items ?? []).filter((item) => {
    if (filter === 'pending' && item.checked) return false
    if (filter === 'done' && !item.checked) return false
    return true
  })

  const pendingCount = activeList?.items.filter((i) => !i.checked).length ?? 0
  const checkedCount = activeList?.items.filter((i) => i.checked).length ?? 0

  return (
    <div className="app">
      <header className="app-header">
        {!isOnline && (
          <p className="offline-banner">Sem internet — salvo no aparelho</p>
        )}
        <div className="app-header-row">
          <div>
            <p className="app-label">Lista</p>
            {editingTitle ? (
              <input
                className="title-edit"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle()
                  if (e.key === 'Escape') setEditingTitle(false)
                }}
                autoFocus
              />
            ) : (
              <button type="button" className="title-btn" onClick={startEditTitle}>
                <h1>{activeList?.name ?? 'Compras'}</h1>
                <span className="title-edit-hint">✎</span>
              </button>
            )}
          </div>
          <div className="app-header-actions">
            {pendingCount > 0 && (
              <span className="count-badge">{pendingCount}</span>
            )}
            <button type="button" className="btn-share" onClick={() => setShowShare(true)}>
              Compartilhar
            </button>
          </div>
        </div>
      </header>

      {importNotice && (
        <div className="toast" onClick={dismissNotice}>{importNotice}</div>
      )}

      <main className="sheet">
        <form className="add-form" onSubmit={(e) => { e.preventDefault(); handleAddItem() }}>
          <div className="add-main">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adicionar item…"
            />
            <button type="submit" className="btn-add" disabled={!name.trim()} aria-label="Adicionar">+</button>
          </div>
          <div className="add-meta">
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="qty"
              aria-label="Quantidade"
            />
            <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unidade">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoria">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </form>

        <div className="tabs">
          {[['all', 'Todos'], ['pending', 'Faltam'], ['done', 'Pegos']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={filter === key ? 'active' : ''}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="items">
          {filteredItems.length === 0 && (
            <li className="empty">Nada na lista ainda</li>
          )}
          {filteredItems.map((item) => (
            <li key={item.id} className={item.checked ? 'done' : ''}>
              <label className="item-check">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id)}
                />
                <span className="check-ui" />
              </label>
              <div className="item-body">
                {editingId === item.id ? (
                  <input
                    className="inline-edit"
                    defaultValue={item.name}
                    autoFocus
                    onBlur={(e) => {
                      editItem(item.id, { name: e.target.value.trim() || item.name })
                      setEditingId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                ) : (
                  <span className="item-text" onDoubleClick={() => setEditingId(item.id)}>
                    {(item.quantity > 1 || item.unit !== 'un') && (
                      <span className="item-qty">{item.quantity} {item.unit}</span>
                    )}
                    {item.name}
                  </span>
                )}
                {item.category !== 'Outros' && (
                  <span className="item-cat">{item.category}</span>
                )}
              </div>
              <button type="button" className="item-remove" onClick={() => removeItem(item.id)} aria-label="Remover">×</button>
            </li>
          ))}
        </ul>

        {(activeList?.items.length ?? 0) > 0 && (
          <footer>
            <span>{pendingCount} {pendingCount === 1 ? 'item' : 'itens'} restante{pendingCount !== 1 ? 's' : ''}</span>
            {checkedCount > 0 && (
              <button type="button" className="link" onClick={clearChecked}>Limpar pegos</button>
            )}
          </footer>
        )}
      </main>

      {showShare && (
        <SharePanel
          list={activeList}
          onImport={importSharedList}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}

export default App
