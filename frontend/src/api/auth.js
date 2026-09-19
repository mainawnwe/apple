const API = '/api/auth/'

function getToken() {
  return localStorage.getItem('token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Token ${token}` } : {}
}

async function handle(res) {
  let data = null
  try { data = await res.json() } catch { /* no body */ }
  if (!res.ok) {
    const err = new Error(data?.detail || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export async function signup({ username, email, password }) {
  const res = await fetch(`${API}signup/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  return handle(res)
}

export async function verifySignup({ email, code }) {
  const res = await fetch(`${API}verify-signup/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  return handle(res)
}

export async function resendCode({ email, purpose }) {
  const res = await fetch(`${API}resend-code/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, purpose }),
  })
  return handle(res)
}

export async function login({ username, password }) {
  const res = await fetch(`${API}login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return handle(res)
}

export async function logout() {
  const res = await fetch(`${API}logout/`, {
    method: 'POST',
    headers: { ...authHeaders() },
  })
  return handle(res)
}

export async function getMe() {
  const res = await fetch(`${API}me/`, {
    headers: { ...authHeaders() },
  })
  return handle(res)
}

export async function forgotPassword({ email }) {
  const res = await fetch(`${API}forgot-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return handle(res)
}

export async function verifyResetCode({ email, code }) {
  const res = await fetch(`${API}verify-reset-code/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  return handle(res)
}

export async function resetPassword({ email, code, new_password }) {
  const res = await fetch(`${API}reset-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, new_password }),
  })
  return handle(res)
}

export async function changePassword({ old_password, new_password }) {
  const res = await fetch(`${API}change-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ old_password, new_password }),
  })
  return handle(res)
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}
