import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage({ onSwitch, onSuccess }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Błąd logowania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">ExtraFun</div>
        <div className="auth-tagline">Witaj z powrotem! 💙</div>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input className="form-input" type="email" placeholder="twoj@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Hasło</label>
            <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Loguję...' : 'Zaloguj się →'}
          </button>
        </form>
        <div className="auth-switch">
          Nie masz konta? <a onClick={onSwitch}>Zarejestruj się</a>
        </div>
      </div>
    </div>
  )
}
