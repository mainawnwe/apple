import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../App.css'
import AppHeader from '../components/AppHeader'
import NoteCard from '../components/NoteCard'
import NoteForm from '../components/NoteForm'
import NoteModal from '../components/NoteModal'
import TagsSidebar from '../components/TagsSidebar'
import { listNotes, createNote, updateNote, deleteNote } from '../api/notes'
import { useConfirm } from '../context/ConfirmContext'

export default function NotesPage() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [activeTags, setActiveTags] = useState([])

  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState(null)

  const location = useLocation()
  const navigate = useNavigate()
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

  useEffect(() => {
    const openNote = location.state?.openNote
    if (!openNote) return
    setViewing(openNote)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state, navigate])

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setShowForm(true)
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        document.querySelector('.search-wrap input')?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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

  const toggleTag = (name) => {
    setActiveTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )
  }

  const clearTags = () => setActiveTags([])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return notes.filter((n) => {
      if (typeFilter !== 'all' && n.note_type !== typeFilter) return false
      if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false

      // Tag filter
      if (activeTags.length > 0) {
        const itemTags = (n.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
        const wantsUntagged = activeTags.includes('__untagged__')
        const specificTags = activeTags.filter((t) => t !== '__untagged__')

        if (wantsUntagged && itemTags.length > 0) return false
        if (specificTags.length > 0) {
          // AND match: item must have ALL selected tags
          const hasAll = specificTags.every((t) => itemTags.includes(t))
          if (!hasAll) return false
        }
      }

      if (!q) return true
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.toLowerCase().includes(q)
      )
    })
  }, [notes, search, typeFilter, priorityFilter, activeTags])

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
          <kbd className="kbd-hint">N</kbd>
        </button>
      </AppHeader>

      <div className="layout-with-sidebar">
        <TagsSidebar
          items={notes}
          activeTags={activeTags}
          onToggleTag={toggleTag}
          onClearTags={clearTags}
        />

        <div className="main-area">
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
                <h2>No notes match</h2>
                <p>Try clearing filters or search.</p>
              </div>
            ) : (
              <div className="grid">
                {filtered.map((note) => (
                  <NoteCard key={note.id} note={note} onOpen={setViewing} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

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