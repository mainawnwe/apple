function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Token ${token}` } : {}
}

export async function getStats() {
  const res = await fetch('/api/stats/', { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
