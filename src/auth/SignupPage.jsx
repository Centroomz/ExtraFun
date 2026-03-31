import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function SignupPage({ onSwitch, onSuccess }) {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Hasła nie są zgodne'); return }
    if (password.length < 6) { setError('Hasło musi mieć minimum 6 znaków'); return }
    if (username.length < 3) { setError('Nick musi mieć minimum 3 znaki'); return }
    setLoading(true)
    try {
      await signUp(email, password, username)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Błąd rejestracji')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Prawie gotowe!</h2>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 20 }}>
            Wysłaliśmy link potwierdzający na <strong>{email}</strong>. Kliknij w link, aby aktywować konto.
          </p>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={onSwitch}>Wróć do logowania</button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">MoreFun</div>
        <div className="auth-tagline">Dołącz do społeczności 🌈</div>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nick</label>
            <input className="form-input" type="text" placeholder="Twój nick" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input className="form-input" type="email" placeholder="twoj@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Hasło</label>
            <input className="form-input" type="password" placeholder="Min. 6 znaków" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Powtórz hasło</label>
            <input className="form-input" type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Rejestruję...' : 'Załóż konto →'}
          </button>
        </form>
        <div className="auth-switch">
          Masz konto? <a onClick={onSwitch}>Zaloguj się</a>
        </div>
      </div>
    </div>
  )
}
