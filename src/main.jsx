import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'

// Route chunks are lazy (App.jsx). A tab opened before a deploy asks for a chunk
// hash that no longer exists → 404 → blank page. Reload once to pick up the new
// index.html instead of showing nothing.
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault()
  const key = 'ef_chunk_reload'
  if (sessionStorage.getItem(key)) return // avoid a reload loop
  sessionStorage.setItem(key, '1')
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)
