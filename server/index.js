import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { registerRoutes } from './routes.js'
import { sendArticleHtml, sendDictTermHtml } from './meta.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '12mb' }))  // logo uploads arrive as base64 dataURL

// Domain redirect (.fun/.club → .pl) — preserved from old server.js
app.use((req, res, next) => {
  const host = req.hostname || ''
  if (host.includes('extrafun.fun') || host.includes('extrafun.club')) {
    return res.redirect(301, `https://extrafun.pl${req.originalUrl}`)
  }
  next()
})

registerRoutes(app)

// Per-article meta injection for crawlers (before static/SPA fallback)
app.get('/magazyn/:slug', (req, res) => sendArticleHtml(req, res, DIST))
app.get('/slownik/:slug', (req, res) => sendDictTermHtml(req, res, DIST))

app.use(express.static(DIST))
app.use((_req, res) => res.sendFile(join(DIST, 'index.html')))

app.listen(PORT, () => console.log(`ExtraFun server on ${PORT}`))
