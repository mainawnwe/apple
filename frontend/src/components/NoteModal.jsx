import { useState } from 'react'
import NoteForm from './NoteForm'

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp)$/i
const isImage = (a) => a.content_type?.startsWith('image/') || IMAGE_EXT.test(a.original_name)

export default function NoteModal({ note, onClose, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)

  const handleUpdate = async (fd) => {
    await onUpdate(note.id, fd)
    setEditing(false)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {editing ? (
          <>
            <h2>Edit note</h2>
            <NoteForm
              initial={note}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          </>
        ) : (
          <>
            <div className="modal-head">
              <div>
                <h2>{note.title || 'Untitled'}</h2>
                <p className="meta">
                  {new Date(note.created_at).toLocaleString()} · <span className={`pill ${note.priority}`}>{note.priority}</span>
                </p>
              </div>
              <button className="close-x" onClick={onClose}>×</button>
            </div>

            {note.content && <p className="modal-content">{note.content}</p>}

            {note.reminder_datetime && (
              <p className="reminder-line">⏰ Reminder: {new Date(note.reminder_datetime).toLocaleString()}</p>
            )}

            {note.tags && (
              <div className="modal-tags">
                {note.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                  <span key={t} className="tag">#{t}</span>
                ))}
              </div>
            )}

            {note.attachments.length > 0 && (
              <div className="modal-attachments">
                {note.attachments.filter(isImage).map((a) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="att-image">
                    <img src={a.url} alt={a.original_name} />
                  </a>
                ))}
                {note.attachments.filter((a) => !isImage(a)).map((a) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="att-file">
                    📎 {a.original_name}
                  </a>
                ))}
              </div>
            )}

            <div className="form-actions">
              <button className="btn-danger" onClick={() => onDelete(note.id)}>Delete</button>
              <button className="btn-primary" onClick={() => setEditing(true)}>Edit</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}