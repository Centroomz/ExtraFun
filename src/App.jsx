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

function ProfilePage({ user, profile, onSignOut }) {
  return (
    <div>
      <div className="page-header">
        <h1>👤 Profil</h1>
      </div>
      <div className="profile-header">
        <div className="profile-avatar">
          {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="profile-info">
          <div className="profile-name">
            {profile?.display_name || profile?.username || 'Użytkownik'}
            {profile?.verified && <span className="verified-badge">✓ Zweryfikowany</span>}
          </div>
          <div className="profile-username">@{profile?.username || '---'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{user?.email}</div>
        </div>
      </div>
      {profile?.bio && (
        <div style={{ padding: '0 16px 16px' }}>
          <div className="glass-card" style={{ padding: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7 }}>{profile.bio}</p>
          </div>
        </div>
      )}
      {profile?.city && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>📍 {profile.city}</div>
        </div>
      )}
      <div style={{ padding: '0 16px 16px' }}>
        <button className="btn-ghost" style={{ width: '100%' }} onClick={onSignOut}>
          Wyloguj się
        </button>
      </div>
    </div>
  )
}

function AppInner() {
  const { user, profile, loading, signOut } = useAuth()
  const [ageConfirmed, setAgeConfirmed] = useState(() => {
    try { return localStorage.getItem('ef_age') === '1' } catch { return false }
  })
  const [activePage, setActivePage] = useState('magazyn')
  const [authMode, setAuthMode] = useState(null) // null | 'login' | 'signup'

  const handleAgeConfirm = () => {
    try { localStorage.setItem('ef_age', '1') } catch {}
    setAgeConfirmed(true)
  }

  const handleNavigate = (page) => {
    if (page === 'profil') {
      if (!user) setAuthMode('login')
      else setActivePage('profil')
    } else {
      setActivePage(page)
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activePage])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">ExtraFun</div>
        <div className="spinner" />
      </div>
    )
  }

  // Auth screens – no nav
  if (authMode === 'login') {
    return (
      <>
        <div className="app-bg" />
        <LoginPage
          onSwitch={() => setAuthMode('signup')}
          onSuccess={() => setAuthMode(null)}
        />
      </>
    )
  }
  if (authMode === 'signup') {
    return (
      <>
        <div className="app-bg" />
        <SignupPage
          onSwitch={() => setAuthMode('login')}
          onSuccess={() => setAuthMode(null)}
        />
      </>
    )
  }

  const renderPage = () => {
    switch (activePage) {
      case 'magazyn': return <Magazyn />
      case 'przewodnik': return <Przewodnik />
      case 'czat': return <Czat user={user} />
      case 'forum': return <Forum user={user} />
      case 'ogloszenia': return <Ogloszenia user={user} />
      case 'profil': return user
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
        <div className="page-content">
          {renderPage()}
        </div>
        <BottomNav
          active={activePage}
          onNavigate={handleNavigate}
        />
        {/* Profile button in header area */}
        <button
          onClick={() => handleNavigate('profil')}
          style={{
            position: 'fixed', top: 16, right: 16, zIndex: 200,
            width: 36, height: 36, borderRadius: '50%',
            background: user
              ? 'linear-gradient(135deg, var(--cyan), var(--purple))'
              : 'var(--glass)',
            border: '1px solid var(--glass-border)',
            color: 'white', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Outfit', fontWeight: 700,
          }}
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
