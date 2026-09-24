import { supabase } from './supabase'

// Ported from bizarriusz/client/src/lib/imageUtils.ts — same shared Supabase
// project, same avatars bucket, same hard rule: every user image upload goes
// through uploadImage(), never a raw supabase.storage upload() in a component,
// never upsert:true (silently overwrites and breaks avatar changes).
const MAX_PX = 1200
const QUALITY = 0.82
export const LONG_CACHE = '31536000'
export const THUMB_PX = 192

export const AVATAR_IMG_STYLE = { width: '100%', height: '100%', objectFit: 'cover' }

export async function compressImage(file, maxPx = MAX_PX, quality = QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        const ratio = Math.min(maxPx / width, maxPx / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compress failed')), 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Load failed')) }
    img.src = url
  })
}

export function thumbPath(path, px = THUMB_PX) {
  return path.replace(/\.[a-z0-9]+$/i, `_${px}.jpg`)
}

// Point a Supabase Storage URL at the pre-generated small variant when the
// slot is small enough to use it; above THUMB_PX the original is the better answer.
export function thumb(url, width) {
  if (!url) return url ?? ''
  const [base, qs] = url.split('?')
  if (!base.includes('/storage/v1/object/public/')) return url
  const target = width <= THUMB_PX ? thumbPath(base) : base
  return qs ? `${target}?${qs}` : target
}

export async function uploadImage(file, { bucket, folder, maxPx = MAX_PX, quality = QUALITY }) {
  const blob = await compressImage(file, maxPx, quality)
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: 'image/jpeg', cacheControl: LONG_CACHE, upsert: false,
  })
  if (error) throw new Error(error.message)
  // Small variant next to the original — a failure here isn't fatal, thumb()
  // falls back to the original if the _192.jpg never showed up.
  try {
    const thumbBlob = await compressImage(file, THUMB_PX, quality)
    await supabase.storage.from(bucket).upload(thumbPath(path), thumbBlob, {
      contentType: 'image/jpeg', cacheControl: LONG_CACHE, upsert: false,
    })
  } catch { /* variant missing → thumb() serves the original */ }
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
