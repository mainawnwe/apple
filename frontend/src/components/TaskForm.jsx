import { useState } from 'react'

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TaskForm({ initial, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [priority, setPriority] = useState(initial?.priority || 'medium')
  const [dueDate, setDueDate] = useState(toLocalInput(initial?.due_date))
  const [reminder, setReminder] = useState(toLocalInput(initial?.reminder_datetime))
  const [tags, setTags] = useState(initial?.tags || '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        reminder_datetime: reminder ? new Date(reminder).toISOString() : null,
        tags,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={255}
        autoFocus
      />

      <textarea
        placeholder="Description (optional)…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <div className="row">
        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label>
          Due date
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>

        <label>
          Reminder
          <input
            type="datetime-local"
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
          />
        </label>
      </div>

      <input
        type="text"
        placeholder="Tags (comma-separated, e.g. work, urgent)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  )
}
