import { join } from 'path'

export function sendArticleHtml(_req, res, dist) {
  res.sendFile(join(dist, 'index.html'))
}
