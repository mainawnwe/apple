import { useState } from 'react'
import TaskForm from './TaskForm'

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function TaskModal({ task, onClose, onUpdate, onDelete, onToggle }) {
  const [editing, setEditing] = useState(false)

  const handleUpdate = async (payload) => {
    await onUpdate(task.id, payload)
    setEditing(false)
    onClose()
  }

  const tags = task.tags
    ? task.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {editing ? (
          <>
            <h2>Edit task</h2>
            <TaskForm
              initial={task}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          </>
        ) : (
          <>
            <div className="modal-head">
              <div style={{ flex: 1 }}>
                <h2 style={{ marginBottom: '0.35rem' }}>
                  <span
                    className={task.completed ? 'struck' : ''}
                    style={task.completed ? { textDecoration: 'line-through', color: '#64647e' } : {}}
                  >
                    {task.title}
                  </span>
                </h2>
                <p className="meta">
                  <span className={`pill ${task.priority}`}>{task.priority}</span>
                  {task.completed && <span style={{ marginLeft: '0.5rem', color: '#6ee7b7' }}>✓ Completed</span>}
                </p>
              </div>
              <button className="close-x" onClick={onClose}>×</button>
            </div>

            {task.description ? (
              <p className="modal-content">{task.description}</p>
            ) : (
              <p className="modal-content" style={{ color: '#64647e', fontStyle: 'italic' }}>
                No description
              </p>
            )}

            {task.due_date && (
              <div className="task-detail-row">
                <span className="label">📅 Due</span>
                <span>{formatDate(task.due_date)}</span>
              </div>
            )}

            {task.reminder_datetime && (
              <div className="task-detail-row reminder-line">
                <span className="label">⏰ Reminder</span>
                <span>
                  {formatDate(task.reminder_datetime)}
                  {task.reminder_sent && (
                    <span style={{ marginLeft: '0.5rem', color: '#6ee7b7', fontSize: '0.75rem' }}>
                      ✓ sent
                    </span>
                  )}
                </span>
              </div>
            )}

            {tags.length > 0 && (
              <div className="modal-tags">
                {tags.map((t) => <span key={t} className="tag">#{t}</span>)}
              </div>
            )}

            <div className="form-actions" style={{ marginTop: '1.25rem' }}>
              <button
                className="btn-danger"
                onClick={() => onDelete(task.id)}
              >
                Delete
              </button>
              <button
                className="btn-ghost"
                onClick={() => onToggle(task)}
              >
                {task.completed ? 'Mark active' : 'Mark complete'}
              </button>
              <button className="btn-primary" onClick={() => setEditing(true)}>
                Edit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
