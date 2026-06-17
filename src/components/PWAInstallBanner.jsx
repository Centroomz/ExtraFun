import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'ef-pwa-install-dismissed'

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
      localStorage.setItem(DISMISSED_KEY, '1')
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(64px + env(safe-area-inset-bottom))',
      left: 0,
      right: 0,
      zIndex: 2000,
      padding: '0 16px',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(21,21,56,0.95)',
        border: '1px solid rgba(233,193,118,0.25)',
        borderRadius: 20,
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(16px)',
        maxWidth: 420,
        width: '100%',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'rgba(233,193,118,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}>
          📲
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
            Zainstaluj ExtraFun
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-dim)' }}>
            Szybszy dostęp, działa offline
          </p>
        </div>
        <button
          onClick={handleInstall}
          style={{
            padding: '8px 16px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
            color: '#ffffff',
            border: 'none',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            letterSpacing: -0.2,
          }}
        >
          Instaluj
        </button>
        <button
          onClick={handleDismiss}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-dim)',
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
