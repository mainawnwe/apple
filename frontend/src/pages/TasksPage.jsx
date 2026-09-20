import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import AppHeader from '../components/AppHeader'
import TaskCard from '../components/TaskCard'
import TaskForm from '../components/TaskForm'
import { listTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import TaskModal from '../components/TaskModal'
import { useConfirm } from '../context/ConfirmContext'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')   // 'all' | 'active' | 'completed'
  const [priorityFilter, setPriorityFilter] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState(null)
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
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (statusFilter === 'active' && t.completed) return false
      if (statusFilter === 'completed' && !t.completed) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (!q) return true
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.toLowerCase().includes(q)
      )
    })
  }, [tasks, search, statusFilter, priorityFilter])

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
        </button>
      </AppHeader>

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
            <h2>{statusFilter === 'completed' ? 'No completed tasks' : 'No tasks yet'}</h2>
            <p>Click <strong>+ New task</strong> to create one.</p>
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
