import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import AppHeader from '../components/AppHeader'
import { getReminders } from '../api/reminders'
import { updateTask } from '../api/tasks'
import { SkeletonReminder } from '../components/Skeleton'

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 0) return ''
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const BUCKETS = [
  { key: 'overdue', title: 'Overdue', icon: '⚠️', variant: 'overdue' },
  { key: 'today', title: 'Today', icon: '🔥', variant: 'today' },
  { key: 'tomorrow', title: 'Tomorrow', icon: '📅', variant: 'tomorrow' },
  { key: 'this_week', title: 'This Week', icon: '📆', variant: 'week' },
  { key: 'later', title: 'Later', icon: '🗓️', variant: 'later' },
]

function ReminderItem({ item, onOpen, onComplete }) {
  const isTask = item.type === 'task'
  const isOverdue =
    new Date(item.reminder_datetime) < new Date() && !item.reminder_sent

  return (
    <div
      className={`reminder-item priority-${item.priority} ${isOverdue ? 'overdue' : ''}`}
      onClick={() => onOpen(item)}
    >
      {isTask ? (
        <label
          className="reminder-check"
          onClick={(e) => {
            e.stopPropagation()
            onComplete(item)
          }}
        >
          <input type="checkbox" checked={false} onChange={() => { }} />
          <span className="checkmark" />
        </label>
      ) : (
        <span className="reminder-icon">📝</span>
      )}

      <div className="reminder-main">
        <span className="reminder-title">{item.title || 'Untitled'}</span>
        {item.content && (
          <span className="reminder-preview">{item.content.slice(0, 80)}</span>
        )}
        {item.tags && (
          <span className="reminder-tags">
            {item.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .map((t) => (
                <span key={t} className="tag">
                  #{t}
                </span>
              ))}
          </span>
        )}
      </div>

      <div className="reminder-time">
        {isOverdue ? (
          <>
            <span className="reminder-ago">{timeAgo(item.reminder_datetime)}</span>
            <span className="reminder-clock">
              {formatTime(item.reminder_datetime)}
            </span>
          </>
        ) : (
          <>
            <span className="reminder-clock">
              {formatTime(item.reminder_datetime)}
            </span>
            <span className="reminder-ago">
              {formatDate(item.reminder_datetime)}
            </span>
          </>
        )}
      </div>

      <span className={`pill ${item.priority}`}>{item.priority}</span>
    </div>
  )
}

export default function RemindersPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const refresh = async () => {
    try {
      setLoading(true)
      const res = await getReminders()
      setData(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const openItem = (item) => {
    if (item.type === 'note') {
      navigate('/', { state: { openNote: item } })
    } else {
      navigate('/tasks', { state: { openTask: item } })
    }
  }

  const completeTask = async (task) => {
    try {
      await updateTask(task.id, { completed: true })
      refresh()
    } catch (e) {
      console.error(e)
    }
  }

  const total = data?.counts?.total || 0

  return (
    <div className="app">
      <AppHeader />

      <main className="reminders-page">
        <div className="reminders-header">
          <h1 className="reminders-heading">⏰ Reminders</h1>
          {data && (
            <div className="reminders-stats">
              <span>
                <strong>{total}</strong> upcoming
              </span>
              {data.counts.overdue > 0 && (
                <span className="reminders-overdue-count">
                  <strong>{data.counts.overdue}</strong> overdue
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="reminders-bucket">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonReminder key={i} />
            ))}
          </div>
        ) : error ? (
          <p className="empty error">Error: {error}</p>
        ) : total === 0 ? (
          <div className="empty-state">
            <h2>No reminders</h2>
            <p>Add a reminder to any note or task to see it here.</p>
          </div>
        ) : (
          <div className="reminders-buckets">
            {BUCKETS.map(({ key, title, icon, variant }) => {
              const items = data.buckets[key] || []
              if (items.length === 0) return null
              return (
                <section key={key} className={`reminders-bucket ${variant}`}>
                  <div className="reminders-bucket-head">
                    <span className="reminders-bucket-title">
                      {icon} {title}
                    </span>
                    <span className="reminders-bucket-count">{items.length}</span>
                  </div>
                  <div className="reminders-list">
                    {items.map((item) => (
                      <ReminderItem
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onOpen={openItem}
                        onComplete={completeTask}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
