// Excludes the site owner's own traffic from first-party analytics
// (page_views, card_stats). Visit any page once with ?ef_owner=1 on a
// device/browser (works for admin's phone, laptop, etc. — set it once per
// browser profile) and that browser stops sending analytics beacons until
// ?ef_owner=0 is used to turn it back on. Persisted in localStorage so it
// survives across sessions, tabs and days.
export function isOwnerTraffic() {
  try {
    const qs = new URLSearchParams(window.location.search)
    const flag = qs.get('ef_owner')
    if (flag === '1') { localStorage.setItem('ef_owner', '1'); return true }
    if (flag === '0') { localStorage.removeItem('ef_owner'); return false }
    return localStorage.getItem('ef_owner') === '1'
  } catch { return false }
}
