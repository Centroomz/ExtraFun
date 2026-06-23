import { Button } from './nocturne'

export function AgeGate({ onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] bg-background text-on-surface flex items-center overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 md:px-16 py-16">
        <div className="font-body text-label-caps uppercase text-primary-container mb-6">18+ · ExtraFun</div>

        <h2 className="font-display italic font-semibold text-display-lg-mobile md:text-display-lg text-on-surface leading-none mb-8">
          Poczekaj chwilę.
        </h2>

        <p className="font-body text-body-lg text-on-surface-variant leading-relaxed max-w-xl mb-10">
          ExtraFun to platforma dla dorosłych, poruszająca tematy związane z relacjami
          i seksualnością. Wchodząc potwierdzasz, że masz ukończone 18 lat i akceptujesz
          nasz regulamin.
        </p>

        <div className="flex flex-wrap items-center gap-6">
          <Button onClick={onConfirm}>Mam 18 lat — wchodzę</Button>
          <button
            onClick={() => { window.location.href = 'https://google.com' }}
            className="font-body text-label-caps uppercase text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Nie, wychodzę
          </button>
        </div>

        <p className="font-body text-label-caps uppercase text-outline mt-16">Wyrafinowana Intymność</p>
      </div>
    </div>
  )
}
