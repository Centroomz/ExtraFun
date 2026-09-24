import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'
import { uploadImage, thumb, AVATAR_IMG_STYLE } from '../lib/imageUtils'
import { PROMPT_CATALOG, MAX_PROMPTS, PROMPT_ANSWER_MAX, sanitizePrompts } from '../lib/prompts'
import { Button } from '../components/nocturne'

const inputCls = 'w-full box-border bg-surface-container border border-outline-variant/30 px-4 py-3 text-on-surface font-body text-body-md outline-none focus:border-primary-container/50'
const labelCls = 'font-body text-label-caps uppercase text-on-surface-variant mb-1.5 block'

function ToggleRow({ active, onToggle, activeLabel, inactiveLabel, actionLabel }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-4 py-3 border text-left transition-colors ${
        active ? 'border-primary-container/40 bg-primary-container/10' : 'border-outline-variant/20 bg-surface-container-low'
      }`}
    >
      <span className="font-body text-body-md text-on-surface">{active ? activeLabel : inactiveLabel}</span>
      <span className="font-body text-label-caps uppercase text-primary-container">{actionLabel}</span>
    </button>
  )
}

export function Profil({ user, onSignOut }) {
  const [, navigate] = useLocation()

  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [about, setAbout] = useState('')
  const [lookingFor, setLookingFor] = useState('')
  const [prompts, setPrompts] = useState([])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [hiddenFromSearch, setHiddenFromSearch] = useState(false) // biz opt-out
  const [hiddenFromExtrafun, setHiddenFromExtrafun] = useState(false) // this portal's opt-out

  const [gallery, setGallery] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  const fileRef = useRef(null)
  const galleryRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const m = session?.user?.user_metadata || {}
      setDisplayName(m.full_name || m.name || m.display_name || '')
      setAge(m.age ? String(m.age) : '')
      setHeight(m.height ? String(m.height) : '')
      setWeight(m.weight ? String(m.weight) : '')
      setAbout(m.about || '')
      setLookingFor(m.looking_for || '')
      setPrompts(sanitizePrompts(m.prompts))
      setAvatarUrl(m.avatar_url || '')
      setHiddenFromSearch(m.hidden_from_search === true)
      setHiddenFromExtrafun(m.hidden_from_extrafun === true)
    })
    apiFetch('/api/gallery').then(setGallery).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true); setInfo(''); setError('')
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: displayName,
        age: age ? Number(age) : null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        about, looking_for: lookingFor,
        prompts: sanitizePrompts(prompts),
        avatar_url: avatarUrl,
      },
    })
    setSaving(false)
    if (error) setError(error.message)
    else setInfo('Zapisano.')
  }

  const uploadErr = (err) => err?.message === 'Load failed' || err?.message === 'Compress failed'
    ? 'Nie udało się wczytać zdjęcia (spróbuj innego formatu).'
    : (err?.message || 'Nie udało się wgrać zdjęcia.')

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    setUploading(true); setError(''); setInfo('')
    try {
      const url = await uploadImage(file, { bucket: 'avatars', folder: `${user.id}/avatar`, maxPx: 512 })
      const { error: updErr } = await supabase.auth.updateUser({ data: { avatar_url: url } })
      if (updErr) throw new Error(updErr.message)
      setAvatarUrl(url)
      setInfo('Zapisano.')
    } catch (err) {
      setError(uploadErr(err))
    } finally {
      setUploading(false)
    }
  }

  const handleGalleryPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    if (gallery.length >= 5) { setError('Maksymalnie 5 zdjęć w galerii.'); return }
    setGalleryUploading(true); setError('')
    try {
      const url = await uploadImage(file, { bucket: 'avatars', folder: `${user.id}/gallery`, maxPx: 1200 })
      const photo = await apiFetch('/api/gallery', { method: 'POST', body: { imageUrl: url } })
      setGallery(g => [...g, photo])
    } catch (err) {
      setError(uploadErr(err))
    } finally {
      setGalleryUploading(false)
    }
  }

  const deletePhoto = async (id) => {
    if (!window.confirm('Usunąć to zdjęcie z galerii? Tej operacji nie można cofnąć.')) return
    try {
      await apiFetch(`/api/gallery/${id}`, { method: 'DELETE' })
      setGallery(g => g.filter(p => p.id !== id))
    } catch (e) { setError('Nie udało się usunąć zdjęcia: ' + (e.message || '')) }
  }

  const toggleSearchVisibility = async () => {
    const next = !hiddenFromSearch
    setHiddenFromSearch(next)
    const { error } = await supabase.auth.updateUser({ data: { hidden_from_search: next } })
    if (error) { setHiddenFromSearch(!next); setError(error.message) }
  }

  const toggleExtrafunVisibility = async () => {
    const next = !hiddenFromExtrafun
    setHiddenFromExtrafun(next)
    try {
      await apiFetch('/api/finder/me/visibility', { method: 'POST', body: { hidden: next } })
    } catch (e) { setHiddenFromExtrafun(!next); setError(e.message || '') }
  }

  const usedQs = new Set(prompts.map(p => p.q))
  const addPrompt = () => {
    if (prompts.length >= MAX_PROMPTS) return
    const free = PROMPT_CATALOG.find(c => !usedQs.has(c.q))
    if (free) setPrompts([...prompts, { q: free.q, a: '' }])
  }
  const setPromptQ = (i, q) => setPrompts(prompts.map((p, j) => j === i ? { ...p, q } : p))
  const setPromptA = (i, a) => setPrompts(prompts.map((p, j) => j === i ? { ...p, a } : p))
  const removePrompt = (i) => setPrompts(prompts.filter((_, j) => j !== i))

  const initials = (displayName || user?.email || '?')[0].toUpperCase()

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <main className="max-w-xl mx-auto px-6 md:px-16 pt-8 pb-24">
        <h1 className="font-display font-semibold text-display-lg-mobile text-on-surface leading-tight mb-6">Profil</h1>

        <div className="flex flex-col gap-4 mb-6">
          <ToggleRow
            active={!hiddenFromSearch}
            onToggle={toggleSearchVisibility}
            activeLabel="🔎 Widoczny w Szukaj na bizarriusz"
            inactiveLabel="🙈 Ukryty w Szukaj na bizarriusz"
            actionLabel={hiddenFromSearch ? 'Pokaż mnie' : 'Ukryj mnie'}
          />
          <ToggleRow
            active={!hiddenFromExtrafun}
            onToggle={toggleExtrafunVisibility}
            activeLabel="🔎 Widoczny w Szukaj na extrafun"
            inactiveLabel="🙈 Ukryty w Szukaj na extrafun"
            actionLabel={hiddenFromExtrafun ? 'Pokaż mnie' : 'Ukryj mnie'}
          />
        </div>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative shrink-0 cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-container flex items-center justify-center border-2 border-primary-container">
              {avatarUrl
                ? <img src={thumb(avatarUrl, 128)} alt="avatar" style={AVATAR_IMG_STYLE} />
                : <span className="font-display text-headline-sm font-bold text-[#1a1400]">{initials}</span>}
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-background border-2 border-background flex items-center justify-center">
              <span className="text-xs">✎</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div className="flex-1 min-w-0">
            <input className={inputCls} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nazwa wyświetlana" maxLength={50} />
            <div className="font-body text-body-sm text-on-surface-variant mt-1">{uploading ? 'Wgrywam…' : user?.email}</div>
          </div>
        </div>

        {/* Age / height / weight */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div><span className={labelCls}>Wiek</span><input className={inputCls} type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="28" min={18} max={99} /></div>
          <div><span className={labelCls}>Wzrost (cm)</span><input className={inputCls} type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="180" min={140} max={220} /></div>
          <div><span className={labelCls}>Waga (kg)</span><input className={inputCls} type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75" min={40} max={200} /></div>
        </div>

        <div className="mb-6">
          <span className={labelCls}>O mnie</span>
          <textarea value={about} onChange={e => setAbout(e.target.value)} placeholder="O mnie…" maxLength={500} rows={3} className={`${inputCls} min-h-[80px]`} />
        </div>

        <div className="mb-6">
          <span className={labelCls}>Szukam</span>
          <textarea value={lookingFor} onChange={e => setLookingFor(e.target.value)} placeholder="Czego szukasz…" maxLength={500} rows={3} className={`${inputCls} min-h-[80px]`} />
        </div>

        {/* Iskierki */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className={labelCls}>✨ Iskierki ({prompts.length}/{MAX_PROMPTS})</span>
            {prompts.length < MAX_PROMPTS && (
              <button onClick={addPrompt} className="font-body text-label-caps uppercase text-primary-container hover:opacity-80">+ Dodaj</button>
            )}
          </div>
          {prompts.length === 0 ? (
            <p className="font-body text-body-sm text-on-surface-variant">Krótkie zaczepki, po których łatwiej do Ciebie napisać. Wybierz do {MAX_PROMPTS}.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {prompts.map((pr, i) => (
                <div key={i} className="border border-outline-variant/20 p-3">
                  <div className="flex gap-2 items-center mb-2">
                    <select value={pr.q} onChange={e => setPromptQ(i, e.target.value)} className={`${inputCls} flex-1`}>
                      {PROMPT_CATALOG.filter(c => c.q === pr.q || !usedQs.has(c.q)).map(c => (
                        <option key={c.id} value={c.q}>{c.q}</option>
                      ))}
                    </select>
                    <button onClick={() => removePrompt(i)} aria-label="Usuń iskierkę" className="w-8 h-8 shrink-0 bg-surface-container text-on-surface-variant hover:text-on-surface">×</button>
                  </div>
                  <textarea value={pr.a} onChange={e => setPromptA(i, e.target.value)} placeholder="Twoja odpowiedź…" maxLength={PROMPT_ANSWER_MAX} rows={2} className={`${inputCls} min-h-[56px]`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gallery */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={labelCls}>Prywatna galeria ({gallery.length}/5)</span>
            {gallery.length < 5 && (
              <button onClick={() => galleryRef.current?.click()} disabled={galleryUploading}
                className="font-body text-label-caps uppercase text-primary-container hover:opacity-80 disabled:opacity-50">
                {galleryUploading ? '…' : '+ Dodaj zdjęcie'}
              </button>
            )}
          </div>
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryPhoto} />
          {gallery.length === 0 ? (
            <p className="font-body text-body-sm text-on-surface-variant">Brak zdjęć w galerii.</p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {gallery.map(photo => (
                <div key={photo.id} className="relative aspect-square bg-surface-container overflow-hidden">
                  <img src={thumb(photo.image_url, 300)} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => deletePhoto(photo.id)} aria-label="Usuń zdjęcie"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-sm leading-none">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {info && <p className="font-body text-body-sm text-primary-container mb-3">✓ {info}</p>}
        {error && <p className="font-body text-body-sm text-red-400 mb-3">{error}</p>}

        <Button onClick={handleSave} disabled={saving}>{saving ? 'Zapisuję…' : 'Zapisz profil'}</Button>

        <div className="flex flex-col gap-3 mt-8">
          <button className="btn-ghost" style={{ width: '100%' }} onClick={onSignOut}>Wyloguj się</button>
          <button
            className="btn-ghost"
            style={{ width: '100%', color: '#e5484d', borderColor: '#e5484d' }}
            onClick={async () => {
              if (!window.confirm('Na pewno chcesz usunąć konto? To nieodwracalne — kasuje profil, wiadomości, ulubione i ogłoszenia na wszystkich portalach (extrafun.pl, gay.pl, bizarriusz.pl).')) return
              if (!window.confirm('Ostatnie potwierdzenie: usuwamy konto na stałe. Kontynuować?')) return
              try {
                await apiFetch('/api/account', { method: 'DELETE' })
                await onSignOut()
              } catch (e) {
                setError('Nie udało się usunąć konta. Spróbuj ponownie lub napisz do nas.')
              }
            }}
          >
            Usuń konto na stałe
          </button>
        </div>
      </main>
    </div>
  )
}
