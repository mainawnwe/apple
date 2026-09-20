const API = '/api/tasks/'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Token ${token}` } : {}
}

async function handle(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const data = await res.json()
      msg = data.detail || JSON.stringify(data)
    } catch { /* no body */ }
    throw new Error(msg)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function listTasks() {
  const res = await fetch(API, { headers: { ...authHeaders() } })
  return handle(res)
}

export async function createTask(payload) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return handle(res)
}

export async function updateTask(id, payload) {
  const res = await fetch(`${API}${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return handle(res)
}

export async function deleteTask(id) {
  const res = await fetch(`${API}${id}/`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  return handle(res)
}
