function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

function formatDue(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d - now
  const diffDays = Math.round(diffMs / 86400000)

  let label
  if (diffMs < 0) label = `Overdue · ${d.toLocaleDateString()}`
  else if (diffDays === 0) label = `Today · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  else if (diffDays === 1) label = 'Tomorrow'
  else if (diffDays <= 7) label = `In ${diffDays} days`
  else label = d.toLocaleDateString()

  return { label, overdue: diffMs < 0 }
}

export default function TaskCard({ task, onToggle, onOpen, onDelete }) {
  const due = formatDue(task.due_date)
  const tags = task.tags ? task.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

  return (
    <article className={`task-card priority-${task.priority} ${task.completed ? 'done' : ''}`}>
      <label className="task-checkbox" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task)}
        />
        <span className="checkmark" />
      </label>

      <div className="task-body" onClick={() => onOpen(task)}>
        <h3 className={task.completed ? 'struck' : ''}>{task.title}</h3>

        {task.description && (
          <p className="task-desc">{task.description}</p>
        )}

        <div className="task-meta">
          {due && (
            <span className={`due ${due.overdue ? 'overdue' : ''}`}>
              📅 {due.label}
            </span>
          )}
          {task.reminder_datetime && (
            <span className="reminder-badge" title="Has reminder">⏰</span>
          )}
          {tags.map((t) => <span key={t} className="tag">#{t}</span>)}
          <span className="time">{timeAgo(task.created_at)}</span>
        </div>
      </div>

      <button
        className="task-delete"
        onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
        aria-label="Delete task"
      >
        ×
      </button>
    </article>
  )
}
