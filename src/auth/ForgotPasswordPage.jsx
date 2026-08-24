import { useState } from 'react'
import { Link } from 'wouter'
import { useAuth } from '../hooks/useAuth'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSuccess('Link do resetowania hasła został wysłany na Twój email.')
    } catch (err) {
      setError(err.message || 'Błąd wysyłania linku')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">ExtraFun</div>
        <div className="auth-tagline">Zresetuj hasło</div>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-input" type="email" placeholder="twoj@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Wysyłam...' : 'Wyślij link →'}
            </button>
          </form>
        )}
        <div className="auth-switch">
          <Link href="/login">Wróć do logowania</Link>
        </div>
      </div>
    </div>
  )
}
