const API = '/api/notes/'

export async function listNotes() {
  const res = await fetch(API)
  if (!res.ok) throw new Error('Failed to load notes')
  return res.json()
}

export async function createNote(formData) {
  const res = await fetch(API, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Failed to create note')
  return res.json()
}

export async function updateNote(id, formData) {
  const res = await fetch(`${API}${id}/`, { method: 'PATCH', body: formData })
  if (!res.ok) throw new Error('Failed to update note')
  return res.json()
}

export async function deleteNote(id) {
  const res = await fetch(`${API}${id}/`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete note')
}