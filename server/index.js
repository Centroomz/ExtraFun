import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { registerRoutes } from './routes.js'
import { sendArticleHtml, sendDictTermHtml, sendHomeHtml, sendVenueHtml, sendSitemap, sendListPageHtml } from './meta.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '12mb' }))  // logo uploads arrive as base64 dataURL

// Security headers (trust signals + basic hardening). Cheap, no behavior change.
app.use((_req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

// Domain redirect (.fun/.club → .pl) — preserved from old server.js
app.use((req, res, next) => {
  const host = req.hostname || ''
  if (host.includes('extrafun.fun') || host.includes('extrafun.club')) {
    return res.redirect(301, `https://extrafun.pl${req.originalUrl}`)
  }
  next()
})

registerRoutes(app)

// Per-page meta + JSON-LD injection for crawlers (before static/SPA fallback)
app.get('/', (req, res) => sendHomeHtml(req, res, DIST))
app.get('/magazyn/:slug', (req, res) => sendArticleHtml(req, res, DIST))
app.get('/slownik/:slug', (req, res) => sendDictTermHtml(req, res, DIST))
// Venue deep-link: only id-prefixed slugs (123-...) are real venue pages; the
// bare /miejsca list + city slugs (warszawa) fall through to the SPA.
app.get('/miejsca/:slug', (req, res, next) =>
  /^\d+(-|$)/.test(req.params.slug) ? sendVenueHtml(req, res, DIST) : next())

// Top-level list/hub pages — previously fell through to the SPA default
// (homepage title + canonical="/"), so Google saw every one as a duplicate.
app.get('/imprezy', (req, res) => sendListPageHtml(req, res, DIST, {
  title: 'Imprezy lifestyle i swingers w Polsce | ExtraFun',
  desc: 'Kalendarz imprez lifestyle, swingersów i CNM w Polsce — kluby, eventy tematyczne, spotkania par i singli.',
}))
app.get('/plaze', (req, res) => sendListPageHtml(req, res, DIST, {
  title: 'Plaże naturystyczne i lifestyle w Polsce | ExtraFun',
  desc: 'Przewodnik po plażach naturystycznych i przyjaznych lifestyle w Polsce — lokalizacje, opisy, dla kogo.',
}))
app.get('/slownik', (req, res) => sendListPageHtml(req, res, DIST, {
  title: 'Słownik CNM, poliamorii i swingu | ExtraFun',
  desc: 'Pojęcia CNM, poliamorii, swingu i BDSM wyjaśnione po polsku — słownik dla świadomych dorosłych.',
}))
app.get('/miejsca', (req, res) => sendListPageHtml(req, res, DIST, {
  title: 'Kluby lifestyle i swingers w Polsce | ExtraFun',
  desc: 'Katalog klubów lifestyle, swingers i miejsc CNM w Polsce — lokalizacje, opisy, godziny otwarcia.',
}))
app.get('/szukaj', (req, res) => sendListPageHtml(req, res, DIST, {
  title: 'Szukaj | ExtraFun',
  desc: 'Szukaj artykułów, miejsc i pojęć na ExtraFun — magazynie CNM, poliamorii i lifestyle.',
}))

// Dynamic sitemap (built from the DB) — must precede static so it isn't
// shadowed by any stale dist/sitemap.xml.
app.get('/sitemap.xml', (req, res) => sendSitemap(req, res))

app.use(express.static(DIST))
app.use((_req, res) => res.sendFile(join(DIST, 'index.html')))

app.listen(PORT, () => console.log(`ExtraFun server on ${PORT}`))
