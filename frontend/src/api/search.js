function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Token ${token}` } : {}
}

export async function globalSearch(q) {
  const res = await fetch(`/api/search/?q=${encodeURIComponent(q)}`, {
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
