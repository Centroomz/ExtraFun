import { useState, useEffect, lazy, Suspense } from 'react'
import { Switch, Route, useLocation, Link } from 'wouter'
import { apiFetch } from './lib/api'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AgeGate } from './components/AgeGate'
import { BottomNav } from './components/BottomNav'
// 128 px webp (1 KB) — rendered at 32 px; the 512 px PNG was 207 KB on every visit.
import extrafunLogo from '/extrafun-logo.webp'
// Code-splitting: Magazyn (home) and ArticleDetailPage (Google landers) stay in
// the main bundle; every other page loads on demand so a newcomer doesn't
// download admin/chat/messages code before the first screen.
import { Magazyn } from './pages/Magazyn'
import { ArticleDetailPage } from './pages/ArticleDetailPage'
const Aktualnosci = lazy(() => import('./pages/Aktualnosci').then(m => ({ default: m.Aktualnosci })))
const Przewodnik = lazy(() => import('./pages/Przewodnik').then(m => ({ default: m.Przewodnik })))
const Czat = lazy(() => import('./pages/Czat').then(m => ({ default: m.Czat })))
const Ogloszenia = lazy(() => import('./pages/Ogloszenia').then(m => ({ default: m.Ogloszenia })))
const Finder = lazy(() => import('./pages/Finder').then(m => ({ default: m.Finder })))
const LoginPage = lazy(() => import('./auth/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./auth/SignupPage').then(m => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() => import('./auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })))
const KategoriaPage = lazy(() => import('./pages/KategoriaPage').then(m => ({ default: m.KategoriaPage })))
const Imprezy = lazy(() => import('./pages/Imprezy').then(m => ({ default: m.Imprezy })))
const Slownik = lazy(() => import('./pages/Slownik').then(m => ({ default: m.Slownik })))
const SlownikTerm = lazy(() => import('./pages/SlownikTerm').then(m => ({ default: m.SlownikTerm })))
const Plaze = lazy(() => import('./pages/Plaze').then(m => ({ default: m.Plaze })))
const Wiadomosci = lazy(() => import('./pages/Wiadomosci').then(m => ({ default: m.Wiadomosci })))
import { PWAInstallBanner } from './components/PWAInstallBanner'

// Raised on browser back/forward, consumed by the scroll effect in App and by
// pages that restore their own position. Registered at module level on purpose
// (see App's scroll effect).
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => { window.__efBackNav = true })
}

const ADMIN_EMAILS = ['pinksservice@gmail.com', 'kingaa.kaczynska@gmail.com']
const isAdmin = (email) => ADMIN_EMAILS.includes(email)

const NAV_ITEMS = [
  {
    id: 'magazyn', label: 'Magazyn', href: '/magazyn',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    )
  },
  {
    id: 'aktualnosci', label: 'Aktualności', href: '/aktualnosci',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
      </svg>
    )
  },
  {
    id: 'miejsca', label: 'Miejsca', href: '/miejsca',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    )
  },
  {
    id: 'slownik', label: 'Słownik', href: '/slownik',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    )
  },
  {
    id: 'imprezy', label: 'Imprezy', href: '/imprezy',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  },
  {
    id: 'plaze', label: 'Plaże', href: '/plaze',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      </svg>
    )
  },
  {
    id: 'czat', label: 'Czat', href: '/czat',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    id: 'ogloszenia', label: 'Ogłoszenia', href: '/ogloszenia',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    )
  },
  {
    id: 'szukaj', label: 'Szukaj', href: '/szukaj',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
      </svg>
    )
  },
]

/* ── Desktop Sidebar Nav ── */
function DesktopNav({ user, profile, onSignOut }) {
  const [location] = useLocation()
  const active = location === '/' ? 'magazyn'
    : location.startsWith('/magazyn') ? 'magazyn'
    : location.startsWith('/aktualnosci') ? 'aktualnosci'
    : location.startsWith('/imprezy') ? 'imprezy'
    : location.startsWith('/miejsca') ? 'miejsca'
    : location.startsWith('/plaze') ? 'plaze'
    : location.startsWith('/czat') ? 'czat'
    : location.startsWith('/slownik') ? 'slownik'
    : location.startsWith('/ogloszenia') ? 'ogloszenia'
    : location.startsWith('/szukaj') ? 'szukaj'
    : location.startsWith('/wiadomosci') ? 'wiadomosci'
    : location.startsWith('/admin') ? 'admin'
    : location.startsWith('/profil') ? 'profil'
    : 'magazyn'

  return (
    <nav className="desktop-nav">
      <Link href="/magazyn">
        <div className="desktop-nav-logo" style={{ cursor: 'pointer' }}>ExtraFun</div>
      </Link>

      <div className="desktop-nav-items">
        {NAV_ITEMS.map(({ id, label, icon, href }) => (
          <Link key={id} href={href}>
            <button className={`desktop-nav-item ${active === id ? 'active' : ''}`}>
              <span className="desktop-nav-item-icon">{icon}</span>
              <span className="desktop-nav-item-label">{label}</span>
            </button>
          </Link>
        ))}
      </div>

      <div className="desktop-nav-footer">
        {user && (
          <Link href="/wiadomosci">
            <button className={`desktop-nav-item ${active === 'wiadomosci' ? 'active' : ''}`}>
              <span className="desktop-nav-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <span className="desktop-nav-item-label">Wiadomości</span>
            </button>
          </Link>
        )}
        {isAdmin(user?.email) && (
          <Link href="/admin">
            <button className={`desktop-nav-item ${active === 'admin' ? 'active' : ''}`}>
              <span className="desktop-nav-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34L9 9m-4.07 5.07A10 10 0 0 0 17.01 20.66L15 15m9-3a10 10 0 0 1-2.93 7.07L17 15M2 12A10 10 0 0 1 4.93 4.93L9 9" />
                </svg>
              </span>
              <span className="desktop-nav-item-label">Admin</span>
            </button>
          </Link>
        )}

        {user ? (
          <Link href="/profil">
            <button className={`desktop-nav-item ${active === 'profil' ? 'active' : ''}`}>
              <span className="desktop-nav-item-icon desktop-nav-avatar">
                {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
              </span>
              <span className="desktop-nav-item-label" style={{ flex: 1, textAlign: 'left' }}>
                {profile?.display_name || profile?.username || 'Profil'}
              </span>
            </button>
          </Link>
        ) : (
          <Link href="/login">
            <button className="desktop-nav-item">
              <span className="desktop-nav-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span className="desktop-nav-item-label">Zaloguj się</span>
            </button>
          </Link>
        )}
      </div>
    </nav>
  )
}

/* ── Profile Page ── */
function ProfilePage({ user, profile, onSignOut }) {
  const [hiddenFromExtrafun, setHiddenFromExtrafun] = useState(null)

  useEffect(() => {
    apiFetch('/api/finder/me/visibility').then(d => setHiddenFromExtrafun(!!d.hiddenFromExtrafun)).catch(() => {})
  }, [])

  const toggleVisibility = async (checked) => {
    setHiddenFromExtrafun(checked) // optimistic
    try {
      const d = await apiFetch('/api/finder/me/visibility', { method: 'POST', body: { hidden: checked } })
      setHiddenFromExtrafun(!!d.hiddenFromExtrafun)
    } catch {
      setHiddenFromExtrafun(!checked) // revert on failure
    }
  }

  return (
    <div className="page-inner">
      <div className="page-header"><h1>Profil</h1></div>
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
            <div className="text-body-md" style={{ color: 'var(--text-dim)', marginTop: 4 }}>{user?.email}</div>
          </div>
        </div>
        {profile?.bio && (
          <div className="glass-card" style={{ padding: 16, margin: '0 0 16px' }}>
            <p className="text-body-md" style={{ color: 'var(--text-dim)', lineHeight: 1.7 }}>{profile.bio}</p>
          </div>
        )}
        {profile?.city && (
          <div className="text-body-md" style={{ color: 'var(--text-dim)', marginBottom: 16 }}>📍 {profile.city}</div>
        )}
        {hiddenFromExtrafun !== null && (
          <label className="text-body-md" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)', marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={hiddenFromExtrafun} onChange={e => toggleVisibility(e.target.checked)} />
            Ukryj mnie w Szukaj na extrafun
          </label>
        )}
        <button className="btn-ghost" style={{ width: '100%' }} onClick={onSignOut}>
          Wyloguj się
        </button>
        <button
          className="btn-ghost"
          style={{ width: '100%', marginTop: 8, color: '#e5484d', borderColor: '#e5484d' }}
          onClick={async () => {
            if (!window.confirm('Na pewno chcesz usunąć konto? To nieodwracalne — kasuje profil, wiadomości, ulubione i ogłoszenia na wszystkich portalach (extrafun.pl, gay.pl, bizarriusz.pl).')) return
            if (!window.confirm('Ostatnie potwierdzenie: usuwamy konto na stałe. Kontynuować?')) return
            try {
              await apiFetch('/api/account', { method: 'DELETE' })
              await onSignOut()
            } catch (e) {
              alert('Nie udało się usunąć konta. Spróbuj ponownie lub napisz do nas.')
            }
          }}
        >
          Usuń konto na stałe
        </button>
      </div>
    </div>
  )
}

/* ── App Inner ── */
function AppInner() {
  const { user, profile, loading, signOut } = useAuth()
  const [location, navigate] = useLocation()

  // Bot detection — skip age gate for crawlers
  const isBot = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|ia_archiver|ahrefsbot|semrushbot/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  )

  // Bizarriusz is an 18+ club site behind its own gate, so a visitor arriving
  // from one of its ads has already confirmed. Showing the gate again meant the
  // ad click landed on a consent screen instead of the article it promised.
  // The confirmation is persisted, so the gate stays gone on later visits.
  const fromBizarriusz = () => {
    try {
      if (new URLSearchParams(window.location.search).get('utm_source') !== 'bizarriusz') return false
      localStorage.setItem('ef_age', '1')
      return true
    } catch { return false }
  }

  const [ageConfirmed, setAgeConfirmed] = useState(() => {
    if (isBot) return true
    try { if (localStorage.getItem('ef_age') === '1') return true } catch {}
    return fromBizarriusz()
  })

  const handleAgeConfirm = () => {
    try { localStorage.setItem('ef_age', '1') } catch {}
    setAgeConfirmed(true)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/magazyn')
  }

  // Scroll to top on route change. On desktop (≥900px) the scroll container is
  // `.page-content` (overflow-y:auto; height:100vh), not the window — so window.scrollTo
  // is a no-op there and the old scroll position leaks into the next page (short pages
  // clamp to their bottom). Reset both.
  // Back/forward (popstate) keeps the position: the page being returned to
  // restores its own scroll (Magazyn mobile feed reads `window.__efBackNav`).
  // The flag is raised by the module-level listener below — it must run before
  // wouter's own popstate handler re-renders the route, or the page mounts too early.
  useEffect(() => {
    // In-app route changes seen this session — "← Powrót" buttons use it to tell an
    // internal history entry (safe to history.back()) from an external referrer.
    window.__efNavCount = (window.__efNavCount || 0) + 1
    if (window.__efBackNav) { setTimeout(() => { window.__efBackNav = false }, 0); return }
    window.scrollTo(0, 0)
    document.querySelector('.page-content')?.scrollTo(0, 0)
  }, [location])

  // First-party analytics: one page-view per route change (fire-and-forget).
  useEffect(() => {
    if (isBot) return
    try {
      // localStorage (persists across visits) so returning visitors keep the same
      // id — sessionStorage reset every visit and made ~100% of traffic look "new".
      let sid = localStorage.getItem('ef_sid') || sessionStorage.getItem('ef_sid')
      if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36) }
      try { localStorage.setItem('ef_sid', sid) } catch { sessionStorage.setItem('ef_sid', sid) }
      let ref = 'direct'
      try { if (document.referrer) ref = new URL(document.referrer).hostname.replace(/^www\./, '') } catch {}
      const device = window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop'
      // utm_source only appears in the URL on the landing pageview (SPA routing
      // drops query params on later navigations) — capture once, keep for the session.
      let utmSource = sessionStorage.getItem('ef_utm_source')
      let utmMedium = sessionStorage.getItem('ef_utm_medium')
      if (!utmSource) {
        const qs = new URLSearchParams(window.location.search)
        utmSource = qs.get('utm_source')
        utmMedium = qs.get('utm_medium')
        if (utmSource) { try { sessionStorage.setItem('ef_utm_source', utmSource) } catch {} }
        if (utmMedium) { try { sessionStorage.setItem('ef_utm_medium', utmMedium) } catch {} }
      }
      apiFetch('/api/track', { method: 'POST', body: {
        path: location, referrer: ref, device, sessionId: sid, utmSource: utmSource || undefined, utmMedium: utmMedium || undefined,
      }}).catch(() => {})
    } catch {}
  }, [location])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">ExtraFun</div>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <>
      <div className="app-bg" />
      {!ageConfirmed && <AgeGate onConfirm={handleAgeConfirm} />}
      <div className="app-root">

        {/* Mobile top bar — hidden on desktop */}
        <header className="mobile-topbar">
          <Link href="/magazyn" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={extrafunLogo} alt="ExtraFun" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold-bright)' }}>
              ExtraFun
            </span>
          </Link>
          {isAdmin(user?.email) && (
            <button
              className="mobile-profile-btn-inline"
              onClick={() => navigate('/admin')}
              style={{ background: 'var(--gold)', color: 'var(--onyx)', marginRight: 6 }}
            >
              A
            </button>
          )}
          <button
            className="mobile-profile-btn-inline"
            onClick={() => navigate(user ? '/profil' : '/login')}
          >
            {user
              ? (profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?')
              : '👤'
            }
          </button>
        </header>

        <DesktopNav user={user} profile={profile} onSignOut={handleSignOut} />

        <div className="page-content">
          {/* fallback null: the layout shell stays put while a route chunk loads */}
          <Suspense fallback={null}>
          <Switch>
            <Route path="/" component={Magazyn} />
            <Route path="/magazyn" component={Magazyn} />
            <Route path="/aktualnosci" component={Aktualnosci} />
            <Route path="/magazyn/rubryka/:slug">{(params) => <KategoriaPage slug={params.slug} />}</Route>
            <Route path="/magazyn/:slug" component={ArticleDetailPage} />
            <Route path="/imprezy" component={Imprezy} />
            <Route path="/slownik/:slug">{(params) => <SlownikTerm slug={params.slug} />}</Route>
            <Route path="/slownik" component={Slownik} />
            <Route path="/miejsca" component={Przewodnik} />
            <Route path="/miejsca/:city">{(params) => <Przewodnik city={params.city} />}</Route>
            <Route path="/plaze" component={Plaze} />
            <Route path="/czat">{() => <Czat user={user} />}</Route>
            <Route path="/ogloszenia">{() => <Ogloszenia user={user} />}</Route>
            <Route path="/szukaj">{() => <Finder user={user} />}</Route>
            <Route path="/wiadomosci">{() => <Wiadomosci user={user} />}</Route>
            <Route path="/login">{() => <LoginPage onSwitch={() => navigate('/signup')} onSuccess={() => navigate('/magazyn')} />}</Route>
            <Route path="/signup">{() => <SignupPage onSwitch={() => navigate('/login')} onSuccess={() => navigate('/magazyn')} />}</Route>
            <Route path="/forgot-password" component={ForgotPasswordPage} />
            <Route path="/reset-password">{() => <ResetPasswordPage onSuccess={() => navigate('/magazyn')} />}</Route>
            <Route path="/profil">{() => user
              ? <ProfilePage user={user} profile={profile} onSignOut={handleSignOut} />
              : (() => { navigate('/login'); return null })()
            }</Route>
            <Route path="/admin">{() => isAdmin(user?.email)
              ? <Admin user={user} />
              : <Magazyn />
            }</Route>
            <Route>{() => <Magazyn />}</Route>
          </Switch>
          </Suspense>

          {/* Sister site — inside content column so it doesn't become a flex
              row sibling stealing ~155px of page width on desktop */}
          <div className="text-body-md" style={{ textAlign: 'center', padding: '8px 16px 20px', color: 'rgba(255,255,255,0.2)' }}>
            Portal partnerski:{' '}
            <a href="https://gay.pl" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(232,230,252,0.72)', textDecoration: 'none' }}>gay.pl</a>
          </div>
        </div>

        <BottomNav active={
          location === '/' || location.startsWith('/magazyn') ? 'magazyn'
          : location.startsWith('/aktualnosci') ? 'aktualnosci'
          : location.startsWith('/imprezy') ? 'imprezy'
          : location.startsWith('/miejsca') ? 'przewodnik'
          : location.startsWith('/czat') ? 'czat'
          : location.startsWith('/slownik') ? 'slownik'
          : location.startsWith('/ogloszenia') ? 'ogloszenia'
          : location.startsWith('/szukaj') ? 'szukaj'
          : 'magazyn'
        } onNavigate={(id) => {
          const map = { magazyn: '/magazyn', aktualnosci: '/aktualnosci', imprezy: '/imprezy', przewodnik: '/miejsca', czat: '/czat', slownik: '/slownik', ogloszenia: '/ogloszenia', szukaj: '/szukaj' }
          navigate(map[id] || '/magazyn')
        }} />

        <button
          className="mobile-profile-btn"
          onClick={() => navigate(user ? '/profil' : '/login')}
        >
          {user
            ? (profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?')
            : '👤'
          }
        </button>

      </div>
      <PWAInstallBanner />
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
