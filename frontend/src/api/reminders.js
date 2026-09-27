function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Token ${token}` } : {}
}

export async function getReminders() {
  const res = await fetch('/api/reminders/', { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
