import { useState } from 'react'
import { buildShareUrl } from '../utils/listShare'

export default function SharePanel({ list, onImport, onClose }) {
  const [importText, setImportText] = useState('')
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState('')

  if (!list) return null

  const shareUrl = buildShareUrl(list)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const handleNativeShare = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({ title: list.name, url: shareUrl })
    } catch {
      // cancelou
    }
  }

  const handleImport = async () => {
    setImportError('')
    const ok = await onImport(importText)
    if (ok) {
      setImportText('')
      onClose()
    } else {
      setImportError('link inválido')
    }
  }

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-panel" onClick={(e) => e.stopPropagation()}>
        <header className="share-header">
          <h2>{list.name}</h2>
          <button type="button" className="share-close" onClick={onClose}>×</button>
        </header>

        <p className="share-code">Código <strong>{list.shareCode}</strong></p>

        <div className="share-actions">
          <button type="button" className="share-btn" onClick={handleCopy}>
            {copied ? 'Copiado' : 'Copiar link'}
          </button>
          {'share' in navigator && (
            <button type="button" className="share-btn share-btn--ghost" onClick={handleNativeShare}>
              Mandar
            </button>
          )}
        </div>

        <hr className="share-hr" />

        <p className="share-label">Colar link de outra pessoa</p>
        <textarea
          className="share-import-input"
          placeholder="https://..."
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={2}
        />
        {importError && <p className="share-error">{importError}</p>}
        <button
          type="button"
          className="share-btn share-btn--full"
          onClick={handleImport}
          disabled={!importText.trim()}
        >
          Atualizar lista
        </button>
      </div>
    </div>
  )
}
