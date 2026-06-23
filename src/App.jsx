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
  const [notifPerm, setNotifPerm] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  )

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

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifPerm(perm)
  }

  const sendTestNotif = async () => {
    if (notifPerm !== 'granted') return
    const reg = await navigator.serviceWorker.ready
    const count = tasks.filter(t => !t.done).length
    reg.showNotification('Lista de Tarefas', {
      body: count > 0
        ? `Você tem ${count} tarefa${count !== 1 ? 's' : ''} pendente${count !== 1 ? 's' : ''}.`
        : 'Nenhuma tarefa pendente. Bom trabalho!',
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200],
      data: { url: '/?app=1' },
    })
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
        {swReady && isOnline && <span className="sw-badge">SW ativo</span>}
      </div>

      <div className="card">
        <header>
          <h1>Tarefas</h1>
          {installPrompt && !installed && (
            <button className="install-btn" onClick={handleInstall}>Instalar</button>
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
              <button className="del" onClick={() => remove(task.id)} title="Remover">×</button>
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

      <div className="notif-panel">
        {notifPerm === 'unsupported' && (
          <p className="notif-info">Notificações não suportadas neste navegador.</p>
        )}
        {notifPerm === 'denied' && (
          <p className="notif-info notif-denied">Notificações bloqueadas — libere nas configurações do navegador.</p>
        )}
        {notifPerm === 'default' && (
          <button className="notif-btn" onClick={requestNotifPermission}>
            Ativar notificações
          </button>
        )}
        {notifPerm === 'granted' && (
          <button className="notif-btn notif-btn--test" onClick={sendTestNotif}>
            Testar notificação
          </button>
        )}
      </div>

      <div className="pwa-info">
        <span className={`pwa-feature ${swReady ? 'ok' : ''}`}>Offline</span>
        <span className={`pwa-feature ${installPrompt || installed ? 'ok' : ''}`}>Instalável</span>
        <span className={`pwa-feature ${notifPerm === 'granted' ? 'ok' : ''}`}>Push</span>
        <span className="pwa-feature ok">Dados locais</span>
      </div>
    </div>
  )
}

export default App
