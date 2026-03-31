export function AgeGate({ onConfirm }) {
  return (
    <div className="age-gate">
      <div className="age-gate-card">
        <span className="age-gate-emoji">🔞</span>
        <h2 className="age-gate-title">Poczekaj chwilę.</h2>
        <p className="age-gate-desc">
          MoreFun to platforma dla dorosłych, poruszająca tematy związane z relacjami i seksualnością.
          Wchodząc potwierdzasz, że masz ukończone 18 lat i akceptujesz nasz regulamin.
        </p>
        <button
          className="btn-primary"
          style={{ width: '100%', marginBottom: 10 }}
          onClick={onConfirm}
        >
          Mam 18 lat – wchodzę
        </button>
        <button
          className="btn-ghost"
          style={{ width: '100%' }}
          onClick={() => { window.location.href = 'https://google.com' }}
        >
          Nie, wychodzę
        </button>
      </div>
    </div>
  )
}
