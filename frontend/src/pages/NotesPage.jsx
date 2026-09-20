import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import NoteCard from '../components/NoteCard'
import NoteForm from '../components/NoteForm'
import NoteModal from '../components/NoteModal'
import { listNotes, createNote, updateNote, deleteNote } from '../api/notes'
import { useAuth } from '../context/AuthContext'
import AppHeader from '../components/AppHeader'
import { useConfirm } from '../context/ConfirmContext'

export default function NotesPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState(null)
  const confirm = useConfirm()

  const refresh = async () => {
    try {
      setLoading(true)
      const data = await listNotes()
      setNotes(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const handleCreate = async (fd) => {
    await createNote(fd)
    setShowForm(false)
    refresh()
  }

  const handleUpdate = async (id, fd) => {
    await updateNote(id, fd)
    refresh()
  }

  const handleDelete = async (id) => {
    const note = notes.find((n) => n.id === id)
    const ok = await confirm({
      title: 'Delete this note?',
      message: note?.title
        ? `"${note.title}" and all its attachments will be permanently deleted.`
        : 'This note and all its attachments will be permanently deleted.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    await deleteNote(id)
    setViewing(null)
    refresh()
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return notes.filter((n) => {
      if (typeFilter !== 'all' && n.note_type !== typeFilter) return false
      if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false
      if (!q) return true
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.toLowerCase().includes(q)
      )
    })
  }, [notes, search, typeFilter, priorityFilter])

  return (
    <div className="app">
      <AppHeader>
        <div className="search-wrap">
          <input
            type="text"
            placeholder="Search notes, tags, content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + New note
        </button>
      </AppHeader>

      <div className="filterbar">
        <div className="chip-group">
          {['all', 'text', 'image', 'file'].map((t) => (
            <button
              key={t}
              className={typeFilter === t ? 'chip active' : 'chip'}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="chip-group">
          {['all', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              className={priorityFilter === p ? `chip active dot-${p}` : `chip dot-${p}`}
              onClick={() => setPriorityFilter(p)}
            >
              <span className={`dot ${p}`} /> {p}
            </button>
          ))}
        </div>
      </div>

      <main className="content">
        {loading ? (
          <p className="empty">Loading…</p>
        ) : error ? (
          <p className="empty error">Error: {error}</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h2>No notes yet</h2>
            <p>Click <strong>+ New note</strong> to create your first one.</p>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((note) => (
              <NoteCard key={note.id} note={note} onOpen={setViewing} />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New note</h2>
            <NoteForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {viewing && (
        <NoteModal
          note={viewing}
          onClose={() => setViewing(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
