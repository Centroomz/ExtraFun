import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// Redirect .fun and .club domains to .pl
app.use((req, res, next) => {
  const host = req.hostname || ''
  if (host.includes('extrafun.fun') || host.includes('extrafun.club')) {
    return res.redirect(301, `https://extrafun.pl${req.originalUrl}`)
  }
  next()
})

// Serve static React build
app.use(express.static(join(__dirname, 'dist')))

// SPA fallback — all routes go to index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`ExtraFun running on port ${PORT}`)
})
