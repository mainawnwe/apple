import { useRef, useState } from 'react'

export default function NoteForm({ initial, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [content, setContent] = useState(initial?.content || '')
  const [priority, setPriority] = useState(initial?.priority || 'medium')
  const [noteType, setNoteType] = useState(initial?.note_type || 'text')
  const [tags, setTags] = useState(initial?.tags || '')
  const [reminder, setReminder] = useState(
    initial?.reminder_datetime ? initial.reminder_datetime.slice(0, 16) : ''
  )
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)

  const addFiles = (list) => setFiles((prev) => [...prev, ...Array.from(list)])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() && !content.trim() && files.length === 0) return
    setSubmitting(true)
    const fd = new FormData()
    fd.append('title', title)
    fd.append('content', content)
    fd.append('priority', priority)
    fd.append('note_type', noteType)
    fd.append('tags', tags)
    if (reminder) fd.append('reminder_datetime', new Date(reminder).toISOString())
    files.forEach((f) => fd.append('upload_files', f))
    try {
      await onSubmit(fd)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={255}
        autoFocus
      />

      <textarea
        placeholder="Write something…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
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
          Type
          <select value={noteType} onChange={(e) => setNoteType(e.target.value)}>
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="file">File</option>
          </select>
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
        placeholder="Tags (comma-separated, e.g. work, ideas)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        <p>📎 Drop files here or click to browse</p>
        <span>Images, PDFs, docs, anything</span>
      </div>

      {files.length > 0 && (
        <ul className="file-preview">
          {files.map((f, i) => (
            <li key={i}>
              <span>{f.name}</span>
              <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
            </li>
          ))}
        </ul>
      )}

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create note'}
        </button>
      </div>
    </form>
  )
}