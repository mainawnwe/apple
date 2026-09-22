import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../App.css'
import AppHeader from '../components/AppHeader'
import TaskCard from '../components/TaskCard'
import TaskForm from '../components/TaskForm'
import TaskModal from '../components/TaskModal'
import TagsSidebar from '../components/TagsSidebar'
import { listTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import { useConfirm } from '../context/ConfirmContext'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
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
      const data = await listTasks()
      setTasks(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    const openTask = location.state?.openTask
    if (!openTask) return
    setViewing(openTask)
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

  const handleCreate = async (payload) => {
    await createTask(payload)
    setShowForm(false)
    refresh()
  }

  const handleUpdate = async (id, payload) => {
    await updateTask(id, payload)
    setViewing(null)
    refresh()
  }

  const handleToggle = async (task) => {
    await updateTask(task.id, { completed: !task.completed })
    refresh()
  }

  const handleDelete = async (id) => {
    const task = tasks.find((t) => t.id === id)
    const ok = await confirm({
      title: 'Delete this task?',
      message: task?.title
        ? `"${task.title}" will be permanently deleted. This cannot be undone.`
        : 'This task will be permanently deleted.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    await deleteTask(id)
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
    return tasks.filter((t) => {
      if (statusFilter === 'active' && t.completed) return false
      if (statusFilter === 'completed' && !t.completed) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false

      if (activeTags.length > 0) {
        const itemTags = (t.tags || '').split(',').map((x) => x.trim()).filter(Boolean)
        const wantsUntagged = activeTags.includes('__untagged__')
        const specificTags = activeTags.filter((x) => x !== '__untagged__')

        if (wantsUntagged && itemTags.length > 0) return false
        if (specificTags.length > 0) {
          const hasAll = specificTags.every((x) => itemTags.includes(x))
          if (!hasAll) return false
        }
      }

      if (!q) return true
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.toLowerCase().includes(q)
      )
    })
  }, [tasks, search, statusFilter, priorityFilter, activeTags])

  const activeCount = tasks.filter((t) => !t.completed).length
  const completedCount = tasks.length - activeCount

  return (
    <div className="app">
      <AppHeader>
        <div className="search-wrap">
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + New task
          <kbd className="kbd-hint">N</kbd>
        </button>
      </AppHeader>

      <div className="layout-with-sidebar">
        <TagsSidebar
          items={tasks}
          activeTags={activeTags}
          onToggleTag={toggleTag}
          onClearTags={clearTags}
        />

        <div className="main-area">
          <div className="filterbar">
            <div className="chip-group">
              {[
                { key: 'active', label: `Active (${activeCount})` },
                { key: 'completed', label: `Completed (${completedCount})` },
                { key: 'all', label: 'All' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={statusFilter === key ? 'chip active' : 'chip'}
                  onClick={() => setStatusFilter(key)}
                >
                  {label}
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
                <h2>No tasks match</h2>
                <p>Try clearing filters or search.</p>
              </div>
            ) : (
              <div className="task-list-vertical">
                {filtered.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onOpen={setViewing}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New task</h2>
            <TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {viewing && (
        <TaskModal
          task={viewing}
          onClose={() => setViewing(null)}
          onUpdate={handleUpdate}
          onDelete={async (id) => {
            const ok = await confirm({
              title: 'Delete this task?',
              message: viewing.title
                ? `"${viewing.title}" will be permanently deleted.`
                : 'This task will be permanently deleted.',
              confirmText: 'Delete',
              variant: 'danger',
            })
            if (!ok) return
            await deleteTask(id)
            setViewing(null)
            refresh()
          }}
          onToggle={async (task) => {
            await updateTask(task.id, { completed: !task.completed })
            setViewing({ ...task, completed: !task.completed })
            refresh()
          }}
        />
      )}
    </div>
  )
}