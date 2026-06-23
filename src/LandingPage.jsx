import { QRCodeSVG } from 'qrcode.react'
import './LandingPage.css'

function detectBrowser() {
  const ua = navigator.userAgent
  if (/EdgA?\//.test(ua)) return 'edge'
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'chrome'
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'safari'
  if (/Firefox\//.test(ua)) return 'firefox'
  return 'other'
}

const INSTALL_HINTS = {
  chrome: 'Clique no ícone ⬇ na barra de endereço do Chrome',
  edge: 'Clique em ··· → Aplicativos → Instalar este site como aplicativo',
  safari: 'Toque em Compartilhar → Adicionar à Tela de Início',
  firefox: 'Firefox não suporta instalação de PWA no desktop',
  other: 'Use Chrome ou Edge para instalar',
}

export default function LandingPage({ installPrompt, installed, onInstall }) {
  const appUrl = window.location.origin + window.location.pathname
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(appUrl)
  const browser = detectBrowser()

  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-logo">
          <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" rx="96" fill="#6366f1"/>
            <rect x="140" y="170" width="220" height="28" rx="14" fill="white" opacity="0.9"/>
            <rect x="140" y="220" width="260" height="28" rx="14" fill="white" opacity="0.7"/>
            <rect x="140" y="270" width="170" height="28" rx="14" fill="white" opacity="0.5"/>
            <circle cx="106" cy="184" r="18" fill="white" opacity="0.9"/>
            <polyline points="97,184 103,191 116,174" stroke="#6366f1" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="106" cy="234" r="18" fill="white" opacity="0.7"/>
            <polyline points="97,234 103,241 116,224" stroke="#6366f1" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="106" cy="284" r="18" fill="white" opacity="0.5"/>
          </svg>
        </div>
        <div>
          <h1 className="lp-name">Lista de Tarefas</h1>
          <p className="lp-tagline">Simples. Offline. Sem conta.</p>
        </div>
      </header>

      <main className="lp-main">
        <section className="lp-section">
          <p className="lp-section-label">No celular — escaneie para instalar</p>
          <div className="lp-qr">
            <QRCodeSVG value={appUrl} size={160} bgColor="#fff" fgColor="#111827" level="M" />
          </div>
          {isLocalhost && (
            <p className="lp-warn">
              Em rede local — acesse pelo IP da máquina, não localhost
            </p>
          )}
        </section>

        <div className="lp-divider"><span>ou</span></div>

        <section className="lp-section">
          <p className="lp-section-label">No computador</p>
          {installed ? (
            <p className="lp-installed">Instalado</p>
          ) : installPrompt ? (
            <button className="lp-btn" onClick={onInstall}>Instalar app</button>
          ) : (
            <>
              <button
                className="lp-btn lp-btn--outline"
                onClick={() => {
                  if (installPrompt) { onInstall(); return }
                  window.open(appUrl, '_blank')
                }}
              >
                Abrir no navegador
              </button>
              <p className="lp-hint">{INSTALL_HINTS[browser]}</p>
            </>
          )}
        </section>
      </main>

      <footer className="lp-footer">
        <a href="?app=1" className="lp-skip">Acessar direto →</a>
      </footer>
    </div>
  )
}
