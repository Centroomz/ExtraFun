import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

// The recovery link carries the token in the URL hash; establish a session
// from it before updateUser, otherwise it fails with "Auth session missing".
// Submit stays disabled until the session is confirmed — same race that hit
// bizarriusz.pl and gay.pl in prod (incident 2026-08-24).
export function ResetPasswordPage({ onSuccess }) {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let mounted = true
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && mounted) { setError(''); setSessionReady(true) }
    })
    ;(async () => {
      try {
        const hash = window.location.hash
        if (hash.includes('access_token')) {
          const p = new URLSearchParams(hash.slice(1))
          const access_token = p.get('access_token')
          const refresh_token = p.get('refresh_token')
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token })
          }
        } else if (window.location.search.includes('code=')) {
          const code = new URLSearchParams(window.location.search).get('code')
          if (code) await supabase.auth.exchangeCodeForSession(code)
        }
      } catch { /* ignore — handled below */ }
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (data.session) setSessionReady(true)
      else setError('Link resetujący wygasł lub jest nieprawidłowy. Poproś o nowy.')
    })()
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!sessionReady) return
    if (password !== password2) { setError('Hasła się nie zgadzają'); return }
    if (password.length < 6) { setError('Hasło musi mieć minimum 6 znaków'); return }
    setError('')
    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess('Hasło zostało zmienione!')
      setTimeout(() => onSuccess?.(), 2000)
    } catch (err) {
      setError(err.message || 'Błąd zmiany hasła')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">ExtraFun</div>
        <div className="auth-tagline">Ustaw nowe hasło</div>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nowe hasło</label>
              <input className="form-input" type="password" placeholder="min. 6 znaków" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Powtórz hasło</label>
              <input className="form-input" type="password" value={password2} onChange={e => setPassword2(e.target.value)} required />
            </div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading || !sessionReady}>
              {loading ? 'Zapisuję...' : sessionReady ? 'Zmień hasło →' : 'Przygotowuję sesję...'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
