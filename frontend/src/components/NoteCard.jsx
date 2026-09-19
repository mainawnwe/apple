const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp)$/i

function isImage(att) {
  return att.content_type?.startsWith('image/') || IMAGE_EXT.test(att.original_name)
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function NoteCard({ note, onOpen }) {
  const images = note.attachments.filter(isImage)
  const files = note.attachments.filter((a) => !isImage(a))
  const tags = note.tags ? note.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

  return (
    <article className={`note-card priority-${note.priority}`} onClick={() => onOpen(note)}>
      {images[0] && (
        <div className="card-thumb">
          <img src={images[0].url} alt="" loading="lazy" />
          {images.length > 1 && <span className="thumb-count">+{images.length - 1}</span>}
        </div>
      )}

      <div className="card-body">
        <div className="card-head">
          <h3>{note.title || 'Untitled'}</h3>
          {note.reminder_datetime && (
            <span className="reminder-badge" title={new Date(note.reminder_datetime).toLocaleString()}>
              ⏰
            </span>
          )}
        </div>

        {note.content && <p className="card-preview">{note.content}</p>}

        {files.length > 0 && (
          <div className="card-files">
            {files.slice(0, 3).map((f) => (
              <span key={f.id} className="file-chip">
                📎 {f.original_name.length > 20 ? f.original_name.slice(0, 18) + '…' : f.original_name}
              </span>
            ))}
            {files.length > 3 && <span className="file-chip">+{files.length - 3}</span>}
          </div>
        )}

        {tags.length > 0 && (
          <div className="card-tags">
            {tags.map((t) => <span key={t} className="tag">#{t}</span>)}
          </div>
        )}

        <div className="card-foot">
          <span className={`dot ${note.priority}`} />
          <span className="time">{timeAgo(note.updated_at)}</span>
        </div>
      </div>
    </article>
  )
}