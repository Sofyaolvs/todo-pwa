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

const HINTS = {
  chrome: 'Ícone de instalar na barra de endereço',
  edge: 'Menu ··· → Instalar',
  safari: 'Compartilhar → Tela de Início',
  firefox: 'No Firefox desktop não instala PWA',
  other: 'Tente no Chrome ou Edge',
}

export default function LandingPage({ installPrompt, onInstall }) {
  const appUrl = window.location.origin + window.location.pathname + '?app=1'
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(appUrl)
  const browser = detectBrowser()

  return (
    <div className="lp">
      <div className="lp-card">
        <img src="/icon.svg" alt="" className="lp-icon" width="56" height="56" />
        <h1>Compras</h1>
        <p className="lp-sub">Lista pro mercado. Funciona offline.</p>

        <div className="lp-qr">
          <QRCodeSVG value={appUrl} size={152} bgColor="#fffcf8" fgColor="#1c1917" level="M" />
        </div>
        <p className="lp-qr-label">Escaneie no celular</p>

        {isLocalhost && (
          <p className="lp-note">Localhost — no celular use o IP da máquina</p>
        )}

        {installPrompt ? (
          <button type="button" className="lp-btn" onClick={onInstall}>Instalar</button>
        ) : (
          <a href="?app=1" className="lp-btn">Abrir app</a>
        )}

        {!installPrompt && (
          <p className="lp-hint">{HINTS[browser]}</p>
        )}
      </div>

      <a href="?app=1" className="lp-skip">Entrar sem instalar</a>
    </div>
  )
}
