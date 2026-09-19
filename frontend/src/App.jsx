import { useEffect, useState } from 'react'
import './App.css'

const API_URL = '/api/tasks/'

function App() {
  const [tasks, setTasks] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    const res = await fetch(API_URL)
    const data = await res.json()
    setTasks(data)
    setLoading(false)
  }

  useEffect(() => { fetchTasks() }, [])

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), priority }),
    })
    if (res.ok) {
      setNewTitle('')
      setPriority('medium')
      fetchTasks()
    }
  }

  const toggleTask = async (task) => {
    await fetch(`${API_URL}${task.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    })
    fetchTasks()
  }

  const deleteTask = async (id) => {
    await fetch(`${API_URL}${id}/`, { method: 'DELETE' })
    fetchTasks()
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const remaining = tasks.filter((t) => !t.completed).length

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>My Tasks</h1>
          <p className="subtitle">
            {remaining === 0
              ? 'All caught up 🎉'
              : `${remaining} task${remaining !== 1 ? 's' : ''} remaining`}
          </p>
        </header>

        <form className="add-form" onSubmit={addTask}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What needs to be done?"
            maxLength={200}
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button type="submit">Add</button>
        </form>

        <div className="filters">
          {['all', 'active', 'completed'].map((f) => (
            <button
              key={f}
              className={filter === f ? 'active' : ''}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="empty">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="empty">Nothing here yet. Add a task above.</p>
        ) : (
          <ul className="task-list">
            {filtered.map((task) => (
              <li
                key={task.id}
                className={`task ${task.completed ? 'done' : ''} priority-${task.priority}`}
              >
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                  />
                  <span className="checkmark" />
                </label>
                <span className="title">{task.title}</span>
                <span className={`badge ${task.priority}`}>{task.priority}</span>
                <button
                  className="delete"
                  onClick={() => deleteTask(task.id)}
                  aria-label="Delete task"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App