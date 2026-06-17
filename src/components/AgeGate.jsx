export function AgeGate({ onConfirm }) {
  return (
    <div className="ef-gate">
      <div className="ef-gate-card">
        <div className="ef-gate-badge">
          <div className="ef-gate-badge-inner">
            <span className="ef-gate-badge-num">18+</span>
          </div>
        </div>

        <h2 className="ef-gate-title">Poczekaj chwilę.</h2>
        <p className="ef-gate-desc">
          ExtraFun to platforma dla dorosłych, poruszająca tematy związane z relacjami
          i seksualnością. Wchodząc potwierdzasz, że masz ukończone 18 lat i akceptujesz
          nasz regulamin.
        </p>

        <div className="ef-gate-btns">
          <button className="ef-gate-btn ef-gate-btn--primary" onClick={onConfirm}>
            Mam 18 lat — wchodzę
          </button>
          <button
            className="ef-gate-btn ef-gate-btn--ghost"
            onClick={() => { window.location.href = 'https://google.com' }}
          >
            Nie, wychodzę
          </button>
        </div>

        <p className="ef-gate-foot">Wyrafinowana Intymność</p>
      </div>
    </div>
  )
}
