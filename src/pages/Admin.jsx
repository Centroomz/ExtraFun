import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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
    const { data } = await supabase.from('articles')
      .select('id, title, slug, excerpt, category_slug, status, featured, cover_image, content, author, tags, created_at')
      .eq('site', 'extrafun')
      .order('created_at', { ascending: false })
    setArticles(data || [])
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
    let error
    if (mode?.id) {
      ;({ error } = await supabase.from('articles').update(payload).eq('id', mode.id))
    } else {
      ;({ error } = await supabase.from('articles').insert(payload))
    }
    setSaving(false)
    if (error) { setMsg('Błąd: ' + error.message); return }
    setMsg(mode?.id ? 'Zaktualizowano!' : 'Dodano artykuł!')
    setMode(null)
    load()
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Usunąć artykuł: "${title}"?`)) return
    await supabase.from('articles').delete().eq('id', id)
    load()
  }

  const toggleStatus = async (article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    await supabase.from('articles').update({ status: newStatus }).eq('id', article.id)
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

// ── AdsTab ────────────────────────────────────────────────────────────────────
function AdsTab() {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('ads')
      .select('id, title, description, category, status, created_at, location')
      .eq('portal', 'extrafun')
      .order('created_at', { ascending: false })
      .limit(50)
    setAds(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, title) => {
    if (!confirm(`Usunąć ogłoszenie: "${title}"?`)) return
    await supabase.from('ads').delete().eq('id', id)
    load()
  }

  const toggleStatus = async (ad) => {
    const newStatus = ad.status === 'active' ? 'removed' : 'active'
    await supabase.from('ads').update({ status: newStatus }).eq('id', ad.id)
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
    { id: 'artykuly', label: '📰 Artykuły' },
    { id: 'ogloszenia', label: '📋 Ogłoszenia' },
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
        {tab === 'artykuly' && <ArticlesTab />}
        {tab === 'ogloszenia' && <AdsTab />}
      </div>
    </div>
  )
}
