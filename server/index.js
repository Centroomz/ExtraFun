import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { registerRoutes } from './routes.js'
import { sendArticleHtml, sendDictTermHtml, sendHomeHtml, sendVenueHtml } from './meta.js'

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

app.use(express.static(DIST))
app.use((_req, res) => res.sendFile(join(DIST, 'index.html')))

app.listen(PORT, () => console.log(`ExtraFun server on ${PORT}`))
