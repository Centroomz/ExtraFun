import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AgeGate } from './components/AgeGate'
import { BottomNav } from './components/BottomNav'
import { Magazyn } from './pages/Magazyn'
import { Przewodnik } from './pages/Przewodnik'
import { Czat } from './pages/Czat'
import { Forum } from './pages/Forum'
import { Ogloszenia } from './pages/Ogloszenia'
import { LoginPage } from './auth/LoginPage'
import { SignupPage } from './auth/SignupPage'
import { Admin } from './pages/Admin'

const ADMIN_EMAIL = 'pinksservice@gmail.com'

const NAV_ITEMS = [
  {
    id: 'magazyn', label: 'Magazyn',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    )
  },
  {
    id: 'przewodnik', label: 'Miejsca',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    )
  },
  {
    id: 'czat', label: 'Czat',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    id: 'forum', label: 'Forum',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    id: 'ogloszenia', label: 'Ogłoszenia',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    )
  },
]

/* ── Desktop Sidebar Nav ── */
function DesktopNav({ active, onNavigate, user, profile, onSignOut }) {
  return (
    <nav className="desktop-nav">
      {/* Logo */}
      <div className="desktop-nav-logo" onClick={() => onNavigate('magazyn')}>
        ExtraFun
      </div>

      {/* Nav items */}
      <div className="desktop-nav-items">
        {NAV_ITEMS.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`desktop-nav-item ${active === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <span className="desktop-nav-item-icon">{icon}</span>
            <span className="desktop-nav-item-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Footer: admin + profile */}
      <div className="desktop-nav-footer">
        {user?.email === ADMIN_EMAIL && (
          <button
            className={`desktop-nav-item ${active === 'admin' ? 'active' : ''}`}
            onClick={() => onNavigate('admin')}
          >
            <span className="desktop-nav-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34L9 9m-4.07 5.07A10 10 0 0 0 17.01 20.66L15 15m9-3a10 10 0 0 1-2.93 7.07L17 15M2 12A10 10 0 0 1 4.93 4.93L9 9" />
              </svg>
            </span>
            <span className="desktop-nav-item-label">Admin</span>
          </button>
        )}

        {user ? (
          <button
            className={`desktop-nav-item ${active === 'profil' ? 'active' : ''}`}
            onClick={() => onNavigate('profil')}
          >
            <span className="desktop-nav-item-icon desktop-nav-avatar">
              {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </span>
            <span className="desktop-nav-item-label" style={{ flex: 1, textAlign: 'left' }}>
              {profile?.display_name || profile?.username || 'Profil'}
            </span>
          </button>
        ) : (
          <button
            className="desktop-nav-item"
            onClick={() => onNavigate('login')}
          >
            <span className="desktop-nav-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span className="desktop-nav-item-label">Zaloguj się</span>
          </button>
        )}
      </div>
    </nav>
  )
}

/* ── Profile Page ── */
function ProfilePage({ user, profile, onSignOut }) {
  return (
    <div className="page-inner">
      <div className="page-header">
        <h1>Profil</h1>
      </div>
      <div style={{ maxWidth: 520, padding: '0 16px 80px' }}>
        <div className="profile-header">
          <div className="profile-avatar">
            {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="profile-info">
            <div className="profile-name">
              {profile?.display_name || profile?.username || 'Użytkownik'}
              {profile?.verified && <span className="verified-badge">✓</span>}
            </div>
            <div className="profile-username">@{profile?.username || '---'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{user?.email}</div>
          </div>
        </div>
        {profile?.bio && (
          <div className="glass-card" style={{ padding: 16, margin: '0 0 16px' }}>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7 }}>{profile.bio}</p>
          </div>
        )}
        {profile?.city && (
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 16 }}>📍 {profile.city}</div>
        )}
        <button className="btn-ghost" style={{ width: '100%' }} onClick={onSignOut}>
          Wyloguj się
        </button>
      </div>
    </div>
  )
}

/* ── App Inner ── */
function AppInner() {
  const { user, profile, loading, signOut } = useAuth()
  const [ageConfirmed, setAgeConfirmed] = useState(() => {
    try { return localStorage.getItem('ef_age') === '1' } catch { return false }
  })
  const [activePage, setActivePage] = useState('magazyn')
  const [authMode, setAuthMode] = useState(null)

  const handleAgeConfirm = () => {
    try { localStorage.setItem('ef_age', '1') } catch {}
    setAgeConfirmed(true)
  }

  const handleNavigate = (page) => {
    if (page === 'login') { setAuthMode('login'); return }
    if (page === 'profil' && !user) { setAuthMode('login'); return }
    setActivePage(page)
  }

  useEffect(() => { window.scrollTo(0, 0) }, [activePage])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">ExtraFun</div>
        <div className="spinner" />
      </div>
    )
  }

  if (authMode === 'login') {
    return (
      <>
        <div className="app-bg" />
        <LoginPage onSwitch={() => setAuthMode('signup')} onSuccess={() => setAuthMode(null)} />
      </>
    )
  }
  if (authMode === 'signup') {
    return (
      <>
        <div className="app-bg" />
        <SignupPage onSwitch={() => setAuthMode('login')} onSuccess={() => setAuthMode(null)} />
      </>
    )
  }

  const renderPage = () => {
    switch (activePage) {
      case 'magazyn':    return <Magazyn />
      case 'przewodnik': return <Przewodnik />
      case 'czat':       return <Czat user={user} />
      case 'forum':      return <Forum user={user} />
      case 'ogloszenia': return <Ogloszenia user={user} />
      case 'admin':      return user?.email === ADMIN_EMAIL ? <Admin user={user} /> : <Magazyn />
      case 'profil':     return user
        ? <ProfilePage user={user} profile={profile} onSignOut={async () => { await signOut(); setActivePage('magazyn') }} />
        : null
      default: return <Magazyn />
    }
  }

  return (
    <>
      <div className="app-bg" />
      {!ageConfirmed && <AgeGate onConfirm={handleAgeConfirm} />}
      <div className="app-root">

        {/* Desktop left sidebar */}
        <DesktopNav
          active={activePage}
          onNavigate={handleNavigate}
          user={user}
          profile={profile}
          onSignOut={async () => { await signOut(); setActivePage('magazyn') }}
        />

        {/* Main content */}
        <div className="page-content">
          {renderPage()}
        </div>

        {/* Mobile bottom nav */}
        <BottomNav active={activePage} onNavigate={handleNavigate} />

        {/* Mobile profile button */}
        <button
          className="mobile-profile-btn"
          onClick={() => handleNavigate('profil')}
        >
          {user
            ? (profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?')
            : '👤'
          }
        </button>

      </div>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
