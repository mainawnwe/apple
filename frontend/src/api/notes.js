const API = '/api/notes/'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Token ${token}` } : {}
}

async function handle(res) {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function listNotes() {
  const res = await fetch(API, { headers: { ...authHeaders() } })
  return handle(res)
}

export async function createNote(formData) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  })
  return handle(res)
}

export async function updateNote(id, formData) {
  const res = await fetch(`${API}${id}/`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
    body: formData,
  })
  return handle(res)
}

export async function deleteNote(id) {
  const res = await fetch(`${API}${id}/`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  return handle(res)
}
