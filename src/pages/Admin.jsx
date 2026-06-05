import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

const ADMIN_EMAIL = 'pinksservice@gmail.com'

const CATEGORIES = [
  { slug: 'cnm-101',       name: 'CNM 101' },
  { slug: 'bez-osadu',     name: 'Bez Osądu' },
  { slug: 'pierwszy-raz',  name: 'Pierwszy Raz' },
  { slug: 'slownik',       name: 'Słownik' },
  { slug: 'tam-i-tam',     name: 'Tam i Tam' },
  { slug: 'temat-miesiaca',name: 'Temat Miesiąca' },
  { slug: 'felieton',      name: 'Felieton' },
  { slug: 'kultura',       name: 'Kultura' },
  { slug: 'wellness',      name: 'Wellness' },
  { slug: 'miejsca',       name: 'Miejsca & Ranking' },
]

function slugify(text) {
  return text.toLowerCase()
    .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e')
    .replace(/ł/g,'l').replace(/ń/g,'n').replace(/ó/g,'o')
    .replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const EMPTY_ARTICLE = {
  title: '', slug: '', excerpt: '', content: '',
  cover_image: '', category_slug: 'cnm-101',
  status: 'draft', featured: false, tags: '', author: 'Redakcja ExtraFun',
}

// ── Card style ────────────────────────────────────────────────────────────────
const card = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16,
  padding: '14px 16px',
  marginBottom: 10,
}

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block',
}

const btnPrimary = {
  background: 'linear-gradient(135deg,#00E5FF,#9D4EDD)',
  border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700,
  fontSize: 14, padding: '10px 18px', cursor: 'pointer',
}

const btnDanger = {
  background: 'rgba(255,50,50,0.15)', border: '1px solid rgba(255,50,50,0.3)',
  borderRadius: 8, color: '#ff6b6b', fontWeight: 600, fontSize: 12,
  padding: '6px 12px', cursor: 'pointer',
}

const btnGhost = {
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 12,
  padding: '6px 12px', cursor: 'pointer',
}

// ── ArticleForm ───────────────────────────────────────────────────────────────
function ArticleForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_ARTICLE)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleTitleChange = (v) => {
    set('title', v)
    if (!initial?.id) set('slug', 'extrafun-' + slugify(v))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Tytuł *</label>
        <input style={inputStyle} value={form.title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="Tytuł artykułu" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Slug</label>
          <input style={inputStyle} value={form.slug}
            onChange={e => set('slug', e.target.value)}
            placeholder="extrafun-tytul-artykulu" />
        </div>
        <div>
          <label style={labelStyle}>Autor</label>
          <input style={inputStyle} value={form.author}
            onChange={e => set('author', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Kategoria</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.category_slug}
            onChange={e => set('category_slug', e.target.value)}>
            {CATEGORIES.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.status}
            onChange={e => set('status', e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Zajawka (excerpt)</label>
        <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
          value={form.excerpt}
          onChange={e => set('excerpt', e.target.value)}
          placeholder="Krótki opis artykułu (1-2 zdania)" />
      </div>

      <div>
        <label style={labelStyle}>Treść (Markdown)</label>
        <textarea style={{ ...inputStyle, minHeight: 320, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
          value={form.content}
          onChange={e => set('content', e.target.value)}
          placeholder="# Tytuł&#10;&#10;## Sekcja&#10;&#10;Treść artykułu w Markdown..." />
      </div>

      <div>
        <label style={labelStyle}>Cover Image URL</label>
        <input style={inputStyle} value={form.cover_image}
          onChange={e => set('cover_image', e.target.value)}
          placeholder="https://images.unsplash.com/photo-...?w=800&q=80" />
        {form.cover_image && (
          <img src={form.cover_image} alt="" style={{ marginTop: 8, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10 }} />
        )}
      </div>

      <div>
        <label style={labelStyle}>Tagi (oddzielone przecinkami)</label>
        <input style={inputStyle} value={form.tags}
          onChange={e => set('tags', e.target.value)}
          placeholder="CNM, poliamoria, związki" />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
        <input type="checkbox" checked={form.featured}
          onChange={e => set('featured', e.target.checked)} />
        Wyróżniony (featured)
      </label>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button style={btnGhost} onClick={onCancel}>Anuluj</button>
        <button style={btnPrimary} onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Zapisywanie...' : (initial?.id ? 'Zapisz zmiany' : 'Dodaj artykuł')}
        </button>
      </div>
    </div>
  )
}

// ── ArticlesTab ───────────────────────────────────────────────────────────────
function ArticlesTab() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(null) // null | 'add' | { article }
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try { setArticles(await apiFetch('/api/admin/articles')) } catch { setArticles([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    setSaving(true)
    setMsg('')
    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      cover_image: form.cover_image,
      category_slug: form.category_slug,
      author: form.author,
      status: form.status,
      featured: form.featured,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      site: 'extrafun',
      publish_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    try {
      if (mode?.id) await apiFetch(`/api/admin/articles/${mode.id}`, { method: 'PUT', body: payload })
      else await apiFetch('/api/admin/articles', { method: 'POST', body: payload })
      setSaving(false)
      setMsg(mode?.id ? 'Zaktualizowano!' : 'Dodano artykuł!')
      setMode(null)
      load()
    } catch (e) {
      setSaving(false)
      setMsg('Błąd: ' + e.message)
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Usunąć artykuł: "${title}"?`)) return
    await apiFetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
    load()
  }

  const toggleStatus = async (article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    await apiFetch(`/api/admin/articles/${article.id}`, { method: 'PUT', body: { status: newStatus } })
    load()
  }

  if (mode === 'add' || mode?.id) {
    const initial = mode?.id ? {
      ...mode,
      tags: Array.isArray(mode.tags) ? mode.tags.join(', ') : (mode.tags || ''),
    } : null
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button style={btnGhost} onClick={() => setMode(null)}>← Wróć</button>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{mode?.id ? 'Edytuj artykuł' : 'Nowy artykuł'}</h2>
        </div>
        {msg && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,229,255,0.1)', color: '#00E5FF', marginBottom: 16, fontSize: 13 }}>{msg}</div>}
        <ArticleForm initial={initial} onSave={handleSave} onCancel={() => setMode(null)} saving={saving} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{articles.length} artykułów</div>
        <button style={btnPrimary} onClick={() => setMode('add')}>+ Nowy artykuł</button>
      </div>
      {msg && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,229,255,0.1)', color: '#00E5FF', marginBottom: 12, fontSize: 13 }}>{msg}</div>}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>Ładowanie...</div>
      ) : articles.map(a => (
        <div key={a.id} style={card}>
          <div style={{ display: 'flex', gap: 12 }}>
            {a.cover_image && (
              <img src={a.cover_image} alt="" style={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ fontSize: 11, background: 'rgba(157,78,221,0.2)', color: '#9D4EDD', borderRadius: 6, padding: '2px 7px' }}>{a.category_slug}</span>
                <span style={{ fontSize: 11, background: a.status === 'published' ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.08)', color: a.status === 'published' ? '#00E5FF' : 'rgba(255,255,255,0.5)', borderRadius: 6, padding: '2px 7px' }}>{a.status}</span>
                {a.featured && <span style={{ fontSize: 11, background: 'rgba(255,200,0,0.15)', color: '#FFC800', borderRadius: 6, padding: '2px 7px' }}>★ featured</span>}
                <span style={{ fontSize: 11, background: 'rgba(0,255,150,0.12)', color: '#00FF96', borderRadius: 6, padding: '2px 7px' }}>👁 {a.views ?? 0}</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{a.excerpt?.slice(0, 80)}{a.excerpt?.length > 80 ? '…' : ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
            <button style={btnGhost} onClick={() => toggleStatus(a)}>
              {a.status === 'published' ? 'Cofnij do draft' : '✓ Publikuj'}
            </button>
            <button style={btnGhost} onClick={() => setMode(a)}>✏️ Edytuj</button>
            <button style={btnDanger} onClick={() => handleDelete(a.id, a.title)}>🗑 Usuń</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── StatsTab (ruch) ───────────────────────────────────────────────────────────
function StatsTab() {
  const [rows, setRows] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [days])

  async function load() {
    setLoading(true)
    try { setRows(await apiFetch(`/api/admin/page-views?days=${days}`)) } catch { setRows([]) }
    setLoading(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.5)' }}>Ładowanie…</div>
  if (!rows) return null

  const totalViews = rows.length
  const totalSessions = new Set(rows.map(r => r.session_id)).size
  const byDay = {}, byPath = {}, byRef = {}, byDev = {}
  for (const r of rows) {
    const d = (r.created_at || '').slice(0, 10)
    // visits = distinct sessions per day (not raw page-view rows)
    ;(byDay[d] = byDay[d] || new Set()).add(r.session_id)
    byPath[r.path] = (byPath[r.path] || 0) + 1
    byRef[r.referrer || 'direct'] = (byRef[r.referrer || 'direct'] || 0) + 1
    byDev[r.device || '?'] = (byDev[r.device || '?'] || 0) + 1
  }
  const dailyAsc = Object.entries(byDay).map(([day, set]) => [day, set.size]).sort((a, b) => a[0].localeCompare(b[0]))
  const maxV = Math.max(1, ...dailyAsc.map(([, v]) => v))
  const top = (o, n = 15) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n)

  const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }
  const head = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[7, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)}
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700,
              background: days === d ? '#00E5FF' : 'rgba(255,255,255,0.08)', color: days === d ? '#0a0a1e' : 'rgba(255,255,255,0.6)' }}>
            {d} dni
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ ...card, flex: 1 }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>ODSŁONY</div><div style={{ fontSize: 28, fontWeight: 900, color: '#00E5FF' }}>{totalViews}</div></div>
        <div style={{ ...card, flex: 1 }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>ODWIEDZINY</div><div style={{ fontSize: 28, fontWeight: 900, color: '#00E5FF' }}>{totalSessions}</div></div>
      </div>

      <div style={card}>
        <div style={head}>Odwiedziny dziennie</div>
        {dailyAsc.length === 0 ? <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Brak danych — zbieranie dopiero ruszyło.</div> : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
            {dailyAsc.map(([day, v]) => (
              <div key={day} title={`${day}: ${v}`} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>{v}</span>
                <div style={{ width: '100%', background: '#00E5FF', borderRadius: '4px 4px 0 0', height: `${(v / maxV) * 100}%`, minHeight: 2 }} />
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={card}>
        <div style={head}>Najpopularniejsze strony</div>
        {top(byPath).map(([p, v]) => (
          <div key={p} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
            <span>{p}</span><span style={{ color: 'rgba(255,255,255,0.5)' }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ ...card, flex: 1, minWidth: 220 }}>
          <div style={head}>Źródła ruchu</div>
          {top(byRef).map(([r, v]) => (<div key={r} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}><span>{r}</span><span style={{ color: 'rgba(255,255,255,0.5)' }}>{v}</span></div>))}
        </div>
        <div style={{ ...card, flex: 1, minWidth: 220 }}>
          <div style={head}>Urządzenia</div>
          {top(byDev).map(([d, v]) => (<div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}><span>{d === 'mobile' ? '📱 Telefon' : '💻 Desktop'}</span><span style={{ color: 'rgba(255,255,255,0.5)' }}>{v}</span></div>))}
        </div>
      </div>
    </div>
  )
}

// ── AdsTab ────────────────────────────────────────────────────────────────────
function AdsTab() {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { setAds(await apiFetch('/api/admin/ads')) } catch { setAds([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, title) => {
    if (!confirm(`Usunąć ogłoszenie: "${title}"?`)) return
    await apiFetch(`/api/admin/ads/${id}`, { method: 'DELETE' })
    load()
  }

  const toggleStatus = async (ad) => {
    const newStatus = ad.status === 'active' ? 'removed' : 'active'
    await apiFetch(`/api/admin/ads/${ad.id}`, { method: 'PUT', body: { status: newStatus } })
    load()
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>{ads.length} ogłoszeń</div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>Ładowanie...</div>
      ) : ads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Brak ogłoszeń</div>
      ) : ads.map(a => (
        <div key={a.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{a.title}</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                {a.category && <span style={{ fontSize: 11, background: 'rgba(255,0,128,0.15)', color: '#FF0080', borderRadius: 6, padding: '2px 7px' }}>{a.category}</span>}
                <span style={{ fontSize: 11, background: a.status === 'active' ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.08)', color: a.status === 'active' ? '#00E5FF' : 'rgba(255,255,255,0.4)', borderRadius: 6, padding: '2px 7px' }}>{a.status}</span>
                {a.location && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>📍 {a.location}</span>}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{a.description?.slice(0, 100)}…</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
            <button style={btnGhost} onClick={() => toggleStatus(a)}>
              {a.status === 'active' ? 'Dezaktywuj' : '✓ Aktywuj'}
            </button>
            <button style={btnDanger} onClick={() => handleDelete(a.id, a.title)}>🗑 Usuń</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Admin ────────────────────────────────────────────────────────────────
// Downscale + compress an image file in the browser before upload (≤maxSize px,
// webp) so logos stay tiny and load fast — no manual resizing on the phone.
function downscaleImage(file, maxSize = 512, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        if (width >= height) { height = Math.round(height * maxSize / width); width = maxSize }
        else { width = Math.round(width * maxSize / height); height = maxSize }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      let out = canvas.toDataURL('image/webp', quality)
      if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/jpeg', quality) // Safari fallback
      resolve(out)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Nie udało się wczytać obrazu')) }
    img.src = url
  })
}

// ── VenuesTab (Przewodnik – lokale) ───────────────────────────────────────────
const EMPTY_VENUE = { name: '', type: 'club', scene: 'swing', city: '', address: '', website: '', description: '', latitude: '', longitude: '', logo_url: '' }
const VENUE_TYPES = ['club', 'sauna', 'bar', 'resort', 'kino']
const VENUE_SCENES = ['swing', 'lgbt', 'mixed']

function VenuesTab() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(null) // null | 'add' | venue
  const [form, setForm] = useState(EMPTY_VENUE)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => { load() }, [])
  async function load() { try { setVenues(await apiFetch('/api/admin/venues')) } catch { setVenues([]) } setLoading(false) }

  function openAdd() { setForm(EMPTY_VENUE); setMode('add'); setMsg('') }
  function openEdit(v) { setForm({ ...EMPTY_VENUE, ...v, latitude: v.latitude ?? '', longitude: v.longitude ?? '', description: v.description ?? '', website: v.website ?? '', address: v.address ?? '', logo_url: v.logo_url ?? '' }); setMode(v); setMsg('') }
  const set = (k, val) => setForm(f => ({ ...f, [k]: val }))

  async function save() {
    if (!form.name || !form.city) { setMsg('Nazwa i miasto wymagane'); return }
    setSaving(true); setMsg('')
    try {
      if (mode === 'add') { const created = await apiFetch('/api/admin/venues', { method: 'POST', body: form }); setMode(created); setForm(f => ({ ...f, ...created })) }
      else await apiFetch(`/api/admin/venues/${mode.id}`, { method: 'PUT', body: form })
      await load(); setMsg('Zapisano ✓')
    } catch (e) { setMsg('Błąd: ' + e.message) }
    setSaving(false)
  }
  async function del(v) {
    if (!confirm(`Usunąć „${v.name}"? (wraz z rozkładem)`)) return
    try { await apiFetch(`/api/admin/venues/${v.id}`, { method: 'DELETE' }); if (mode && mode.id === v.id) setMode(null); load() } catch (e) { alert(e.message) }
  }
  async function uploadLogo(file) {
    if (!mode || mode === 'add') { setMsg('Najpierw zapisz lokal, potem dodaj logo'); return }
    setSaving(true); setMsg('')
    const dataUrl = await downscaleImage(file, 512, 0.85)
    try { const res = await apiFetch(`/api/admin/venues/${mode.id}/logo`, { method: 'POST', body: { dataUrl } }); set('logo_url', res.logo_url); load(); setMsg('Logo wgrane ✓') }
    catch (e) { setMsg('Błąd logo: ' + e.message) }
    setSaving(false)
  }

  const inp = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 11px', fontSize: 13, color: '#fff', boxSizing: 'border-box', marginBottom: 8 }
  const lbl = { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3, display: 'block' }

  if (mode) {
    return (
      <div style={{ maxWidth: 560 }}>
        <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: '#00E5FF', cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>← Lista lokali</button>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{mode === 'add' ? 'Nowy lokal' : `Edytuj: ${form.name}`}</h2>
        <label style={lbl}>Nazwa *</label><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><label style={lbl}>Miasto *</label><input style={inp} value={form.city} onChange={e => set('city', e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={lbl}>Typ</label><select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>{VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div style={{ flex: 1 }}><label style={lbl}>Scena</label><select style={inp} value={form.scene} onChange={e => set('scene', e.target.value)}>{VENUE_SCENES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <label style={lbl}>Adres</label><input style={inp} value={form.address} onChange={e => set('address', e.target.value)} />
        <label style={lbl}>Strona WWW</label><input style={inp} value={form.website} onChange={e => set('website', e.target.value)} />
        <label style={lbl}>Opis</label><textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><label style={lbl}>Lat</label><input style={inp} value={form.latitude} onChange={e => set('latitude', e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={lbl}>Lng</label><input style={inp} value={form.longitude} onChange={e => set('longitude', e.target.value)} /></div>
        </div>
        <label style={lbl}>Logo</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          {form.logo_url ? <img src={form.logo_url} alt="" style={{ width: 56, height: 56, objectFit: 'contain', background: '#000', borderRadius: 8 }} /> : <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏠</div>}
          <label style={{ background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', color: '#00E5FF', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}>
            Wgraj logo
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])} />
          </label>
        </div>
        <input style={inp} placeholder="…lub wklej URL logo" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <button onClick={save} disabled={saving} style={{ background: '#00E5FF', color: '#0a0a1e', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? '…' : 'Zapisz'}</button>
          {msg && <span style={{ fontSize: 13, color: msg.startsWith('Błąd') ? '#ff6b6b' : '#00E5FF' }}>{msg}</span>}
        </div>
      </div>
    )
  }

  const list = venues.filter(v => !q || (v.name + ' ' + v.city).toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input style={{ ...inp, marginBottom: 0, flex: 1 }} placeholder="Szukaj (nazwa/miasto)…" value={q} onChange={e => setQ(e.target.value)} />
        <button onClick={openAdd} style={{ background: '#00E5FF', color: '#0a0a1e', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Dodaj</button>
      </div>
      {loading ? <div style={{ color: 'rgba(255,255,255,0.5)' }}>Ładowanie…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px' }}>
              {v.logo_url ? <img src={v.logo_url} alt="" style={{ width: 36, height: 36, objectFit: 'contain', background: '#000', borderRadius: 6, flexShrink: 0 }} /> : <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 6, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{v.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{v.city} · {v.type} · {v.scene}</div>
              </div>
              <button onClick={() => openEdit(v)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Edytuj</button>
              <button onClick={() => del(v)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 16, cursor: 'pointer' }}>🗑️</button>
            </div>
          ))}
          {list.length === 0 && <div style={{ color: 'rgba(255,255,255,0.5)' }}>Brak lokali.</div>}
        </div>
      )}
    </div>
  )
}

export function Admin() {
  const { user } = useAuth()
  const [tab, setTab] = useState('artykuly')

  if (!user) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>Zaloguj się, aby uzyskać dostęp do panelu admina.</div>
      </div>
    )
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⛔</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>Brak dostępu. Tylko administrator może korzystać z tego panelu.</div>
      </div>
    )
  }

  const tabs = [
    { id: 'ruch', label: '📊 Ruch' },
    { id: 'artykuly', label: '📰 Artykuły' },
    { id: 'ogloszenia', label: '📋 Ogłoszenia' },
    { id: 'lokale', label: '🏠 Lokale' },
  ]

  return (
    <div>
      <div className="page-header" style={{ paddingBottom: 0 }}>
        <h1 style={{ background: 'linear-gradient(135deg,#00E5FF,#9D4EDD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ⚙️ Panel Admina
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? 'rgba(0,229,255,0.12)' : 'transparent',
              border: tab === t.id ? '1px solid rgba(0,229,255,0.3)' : '1px solid transparent',
              borderRadius: 10, color: tab === t.id ? '#00E5FF' : 'rgba(255,255,255,0.55)',
              fontWeight: 600, fontSize: 13, padding: '8px 14px', cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {tab === 'ruch' && <StatsTab />}
        {tab === 'artykuly' && <ArticlesTab />}
        {tab === 'ogloszenia' && <AdsTab />}
        {tab === 'lokale' && <VenuesTab />}
      </div>
    </div>
  )
}
