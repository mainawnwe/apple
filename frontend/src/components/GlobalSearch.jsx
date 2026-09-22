import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { globalSearch } from '../api/search'

export default function GlobalSearch({ open, onClose }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState({ notes: [], tasks: [] })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQ('')
      setResults({ notes: [], tasks: [] })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (q.trim().length < 2) {
      setResults({ notes: [], tasks: [] })
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await globalSearch(q.trim())
        setResults({ notes: data.notes || [], tasks: data.tasks || [] })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [q, open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const goToNote = (note) => {
    navigate('/', { state: { openNote: note } })
    onClose()
  }

  const goToTask = (task) => {
    navigate('/tasks', { state: { openTask: task } })
    onClose()
  }

  const hasResults = results.notes.length > 0 || results.tasks.length > 0
  const tooShort = q.trim().length < 2

  return (
    <div className="search-backdrop" onClick={onClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes & tasks…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <kbd className="search-kbd">Esc</kbd>
        </div>

        <div className="search-results">
          {tooShort ? (
            <p className="search-hint">Type at least 2 characters to search</p>
          ) : loading ? (
            <p className="search-hint">Searching…</p>
          ) : !hasResults ? (
            <p className="search-hint">
              No results for <strong>"{q}"</strong>
            </p>
          ) : (
            <>
              {results.notes.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    📝 Notes <span className="count">{results.notes.length}</span>
                  </div>
                  {results.notes.map((note) => (
                    <button
                      key={`n-${note.id}`}
                      className="search-item"
                      onClick={() => goToNote(note)}
                    >
                      <div className="search-item-main">
                        <span className="search-item-title">
                          {note.title || 'Untitled'}
                        </span>
                        {note.content && (
                          <span className="search-item-preview">
                            {note.content.slice(0, 80)}
                            {note.content.length > 80 ? '…' : ''}
                          </span>
                        )}
                      </div>
                      <span className={`pill ${note.priority}`}>{note.priority}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.tasks.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">
                    ✓ Tasks <span className="count">{results.tasks.length}</span>
                  </div>
                  {results.tasks.map((task) => (
                    <button
                      key={`t-${task.id}`}
                      className="search-item"
                      onClick={() => goToTask(task)}
                    >
                      <div className="search-item-main">
                        <span className={`search-item-title ${task.completed ? 'struck' : ''}`}>
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="search-item-preview">
                            {task.description.slice(0, 80)}
                            {task.description.length > 80 ? '…' : ''}
                          </span>
                        )}
                      </div>
                      {task.completed && <span className="check-icon">✓</span>}
                      <span className={`pill ${task.priority}`}>{task.priority}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}