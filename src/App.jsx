import { useState, useEffect } from 'react'
import './App.css'
import LandingPage from './LandingPage'

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    new URLSearchParams(window.location.search).has('app')
  )
}

function App() {
  const [standalone, setStandalone] = useState(isStandaloneMode)

  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tasks')) || [] } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [swReady, setSwReady] = useState(false)

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

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
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setInstallPrompt(null)
    })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => setSwReady(true))
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const onChange = (e) => { if (e.matches) setStandalone(true) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setStandalone(true)
    }
  }

  if (!standalone) {
    return (
      <LandingPage
        installPrompt={installPrompt}
        installed={installed}
        onInstall={handleInstall}
      />
    )
  }

  const addTask = () => {
    const text = input.trim()
    if (!text) return
    setTasks(prev => [...prev, { id: Date.now(), text, done: false }])
    setInput('')
  }

  const toggle = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const remove = (id) => setTasks(prev => prev.filter(t => t.id !== id))
  const clearDone = () => setTasks(prev => prev.filter(t => !t.done))

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    return true
  })

  const activeCount = tasks.filter(t => !t.done).length

  return (
    <div className="app">
      <div className={`status-bar ${isOnline ? 'online' : 'offline'}`}>
        <span className="dot" />
        {isOnline ? 'Online' : 'Offline — dados salvos localmente'}
        {swReady && isOnline && <span className="sw-badge">Service Worker ativo</span>}
      </div>

      <div className="card">
        <header>
          <h1>Tarefas</h1>
          {installPrompt && !installed && (
            <button className="install-btn" onClick={handleInstall}>
              Instalar App
            </button>
          )}
          {installed && <span className="installed-badge">Instalado</span>}
        </header>

        <div className="input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Nova tarefa..."
            autoFocus
          />
          <button onClick={addTask}>Adicionar</button>
        </div>

        <div className="filters">
          {[['all', 'Todas'], ['active', 'Ativas'], ['done', 'Concluidas']].map(([key, label]) => (
            <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>

        <ul className="task-list">
          {filtered.length === 0 && (
            <li className="empty">Nenhuma tarefa aqui.</li>
          )}
          {filtered.map(task => (
            <li key={task.id} className={task.done ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={task.done} onChange={() => toggle(task.id)} />
                <span>{task.text}</span>
              </label>
              <button className="del" onClick={() => remove(task.id)} title="Remover">x</button>
            </li>
          ))}
        </ul>

        {tasks.length > 0 && (
          <footer>
            <span>{activeCount} {activeCount === 1 ? 'tarefa restante' : 'tarefas restantes'}</span>
            {tasks.some(t => t.done) && (
              <button onClick={clearDone}>Limpar concluidas</button>
            )}
          </footer>
        )}
      </div>

      <div className="pwa-info">
        <span className={`pwa-feature ${swReady ? 'ok' : ''}`}>Cache offline</span>
        <span className={`pwa-feature ${installPrompt || installed ? 'ok' : ''}`}>Instalavel</span>
        <span className={`pwa-feature ok`}>Dados locais</span>
      </div>
    </div>
  )
}

export default App
