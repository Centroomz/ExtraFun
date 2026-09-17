import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { TILE_H, Cover, useHtmlSnap } from './MagazynMobileFeed'
import { formatDistance } from '../lib/geo'
import { useImpression, trackClick } from '../lib/cardStats'
import { CardStatBadge } from './CardStatBadge'

// Mobile /ogloszenia = full-screen tiles. Tile 1: top 2/3 = "add an ad" with the
// profile's own data pre-filled (tick to keep / untick to drop), bottom 1/3 =
// search + category chips. Then one tile per ad; tap = detail.

const inputCls = 'w-full box-border bg-surface-container/80 border border-outline-variant/30 px-3 py-2.5 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50'

function Check({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 font-body text-label-caps uppercase text-on-surface-variant">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-[#d4af37] w-4 h-4" />
      {label}
    </label>
  )
}

/* ── Tile 1 ── */
function HeroTile({ user, profile, avatarUrl, age, categories, catEmoji, postCategories, newAd, setNewAd, onSubmit, submitting, search, setSearch, activeCategory, setActiveCategory, count, loading }) {
  const nick = profile?.display_name || profile?.username || ''
  const profileCity = profile?.city || ''
  const profileBio = profile?.bio || ''
  const [useCity, setUseCity] = useState(!!profileCity)
  const [useBio, setUseBio] = useState(!!profileBio)

  // Pre-fill once from the profile; unticking clears the field, ticking restores it.
  useEffect(() => {
    if (!user) return
    setNewAd(prev => ({ ...prev, city: useCity ? profileCity : (prev.city === profileCity ? '' : prev.city) }))
  }, [useCity, profileCity, user]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return
    setNewAd(prev => ({ ...prev, description: useBio ? profileBio : (prev.description === profileBio ? '' : prev.description) }))
  }, [useBio, profileBio, user]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative w-full ${TILE_H} snap-start overflow-hidden flex flex-col`}>
      <Cover image="/editorial/hero-ogloszenia.jpg" position="center" />

      {/* top 2/3 — add */}
      <div className="relative flex-[2] min-h-0 px-margin-mobile pt-4 flex flex-col justify-end">
        {user ? (
          <>
            <span className="font-body text-label-caps uppercase text-primary-container block mb-2">Dodaj ogłoszenie</span>
            <div className="flex items-center gap-3 mb-3">
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-primary-container/40" />
                : <span className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-lg">👤</span>}
              <div className="min-w-0">
                <div className="font-body font-semibold text-body-md text-on-surface truncate">{nick || 'Twój profil'}{age ? ` · ${age} l.` : ''}</div>
                <div className="font-body text-label-caps uppercase text-on-surface-variant">Tak podpiszemy anons</div>
              </div>
            </div>
            <select className={`${inputCls} mb-2`} value={newAd.type} onChange={e => setNewAd(p => ({ ...p, type: e.target.value }))}>
              {postCategories.map(c => <option key={c} value={c}>{catEmoji(c)} {c}</option>)}
            </select>
            <input className={`${inputCls} mb-2`} placeholder="Tytuł ogłoszenia…" value={newAd.title} onChange={e => setNewAd(p => ({ ...p, title: e.target.value }))} />
            <textarea className={`${inputCls} mb-1 min-h-[64px]`} placeholder="Opis…" value={newAd.description} onChange={e => setNewAd(p => ({ ...p, description: e.target.value }))} />
            <div className="flex items-center gap-4 mb-2 flex-wrap">
              {profileBio && <Check checked={useBio} onChange={setUseBio} label="opis z profilu" />}
              {profileCity && <Check checked={useCity} onChange={setUseCity} label={`miasto: ${profileCity}`} />}
            </div>
            {!useCity && (
              <input className={`${inputCls} mb-2`} placeholder="Miasto" value={newAd.city} onChange={e => setNewAd(p => ({ ...p, city: e.target.value }))} />
            )}
            <button onClick={onSubmit} disabled={!newAd.title.trim() || submitting}
              className="w-full bg-primary-container text-[#1a1400] py-3 font-body text-label-caps uppercase font-semibold disabled:opacity-50">
              {submitting ? 'Dodaję…' : 'Opublikuj ogłoszenie'}
            </button>
          </>
        ) : (
          <>
            <span className="font-body text-label-caps uppercase text-primary-container block mb-2">Od społeczności</span>
            <h1 className="font-display font-semibold text-display-lg-mobile text-on-surface leading-none mb-3">Ogłoszenia</h1>
            <p className="font-body text-body-lg text-on-surface-variant leading-snug mb-4">Anonse od ludzi z naszej sceny — pary, single, wydarzenia, fetysz.</p>
            <Link href="/login" className="inline-block w-full text-center bg-primary-container text-[#1a1400] py-3 font-body text-label-caps uppercase font-semibold no-underline">Zaloguj się, żeby dodać anons</Link>
          </>
        )}
      </div>

      {/* bottom 1/3 — search + filter */}
      <div className="relative flex-1 min-h-0 px-margin-mobile pt-4 pb-5 flex flex-col justify-end border-t border-outline-variant/30">
        <div className="relative mb-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj — nick, miasto, treść…" className={inputCls} />
          {search && <button onClick={() => setSearch('')} aria-label="Wyczyść" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">✕</button>}
        </div>
        <div className="flex flex-nowrap gap-x-5 overflow-x-auto scrollbar-none pb-1 mb-3">
          <button onClick={() => setActiveCategory('all')} className={`font-body text-label-caps uppercase whitespace-nowrap pb-1 border-b-2 ${activeCategory === 'all' ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant'}`}>Wszystkie</button>
          {categories.map(({ c, n }) => (
            <button key={c} onClick={() => setActiveCategory(c)} className={`font-body text-label-caps uppercase whitespace-nowrap pb-1 border-b-2 ${activeCategory === c ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant'}`}>
              {catEmoji(c)} {c} <span className="opacity-50">{n}</span>
            </button>
          ))}
        </div>
        <span className="font-body text-label-caps uppercase text-primary-container">
          {loading ? 'Ładowanie…' : count === 0 ? 'Brak ogłoszeń dla tych kryteriów' : `${count} ${count === 1 ? 'ogłoszenie' : 'ogłoszeń'} · przesuń w dół ↓`}
        </span>
      </div>
    </div>
  )
}

/* ── Ad tile ── */
function AdTile({ ad, catEmoji, onOpen }) {
  const ref = useImpression('ad', ad.id)
  return (
    <button ref={ref} onClick={() => { trackClick('ad', ad.id); onOpen() }} className={`relative block w-full ${TILE_H} snap-start overflow-hidden text-left`}>
      <CardStatBadge kind="ad" id={ad.id} className="absolute top-4 left-margin-mobile z-10" />
      {/* No cover photos on ads; the author avatar stays small (user photos are
          not sized for a full-screen tile). */}
      <div className="absolute inset-0 bg-surface-container-low flex items-start justify-center pt-24">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(212,175,55,0.10), transparent 70%)' }} />
        <span className="relative text-7xl opacity-30">{catEmoji(ad.category)}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-margin-mobile pb-6">
        <div className="flex items-center justify-between gap-3 mb-2 font-body text-label-caps uppercase">
          <span className="text-primary-container">{catEmoji(ad.category)} {ad.category || 'Ogłoszenie'}</span>
          {ad.distance != null && <span className="text-outline">{formatDistance(ad.distance)}</span>}
        </div>
        <h2 className="font-display font-semibold text-headline-md text-on-surface leading-tight mb-3 line-clamp-3">{ad.title}</h2>
        {ad.description && <p className="font-body text-body-md text-on-surface-variant leading-relaxed line-clamp-5 mb-4">{ad.description}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-label-caps uppercase text-outline">
          <span className="flex items-center gap-2">
            {ad.author_avatar && <img src={ad.author_avatar} alt="" loading="lazy" className="w-6 h-6 rounded-full object-cover" />}
            <span className="text-on-surface-variant">{ad.author_name || 'Użytkownik'}{ad.author_age ? ` · ${ad.author_age} l.` : ''}</span>
          </span>
          {ad.city && <span>📍 {ad.city}</span>}
          <span>{new Date(ad.created_at).toLocaleDateString('pl')}</span>
        </div>
        <span className="font-body text-label-caps uppercase text-primary-container block mt-3">Otwórz →</span>
      </div>
    </button>
  )
}

export function OgloszeniaMobileFeed({ ads, onOpenAd, catEmoji, ...hero }) {
  useHtmlSnap(true)
  return (
    <div className="lg:hidden">
      <HeroTile catEmoji={catEmoji} count={ads.length} {...hero} />
      {ads.map(ad => <AdTile key={ad.id} ad={ad} catEmoji={catEmoji} onOpen={() => onOpenAd(ad)} />)}
    </div>
  )
}
