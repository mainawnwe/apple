import { useEffect, useState } from 'react'
import '../App.css'
import AppHeader from '../components/AppHeader'
import { getStats } from '../api/stats'

export default function StatsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getStats()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="app">
        <AppHeader />
        <p className="empty" style={{ padding: '4rem 1rem' }}>Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <AppHeader />
        <p className="empty error" style={{ padding: '4rem 1rem' }}>Error: {error}</p>
      </div>
    )
  }

  const t = data.totals
  const maxActivity = Math.max(1, ...data.activity_7d.map((d) => d.total))
  const priorityTotal = Object.values(data.priority_breakdown).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="app">
      <AppHeader />

      <main className="stats-page">
        <h1 className="stats-heading">📊 Your Activity</h1>

        {/* Top stat cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{t.notes}</div>
            <div className="stat-label">Notes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{t.active_tasks}</div>
            <div className="stat-label">Active Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{t.completed_tasks}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-value">{t.completion_rate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>

        {/* Alerts */}
        {(t.overdue_tasks > 0 || data.reminders.notes + data.reminders.tasks > 0) && (
          <div className="stats-alerts">
            {t.overdue_tasks > 0 && (
              <div className="stat-alert danger">
                ⚠️ <strong>{t.overdue_tasks}</strong> overdue task{t.overdue_tasks !== 1 ? 's' : ''}
              </div>
            )}
            {(data.reminders.notes + data.reminders.tasks) > 0 && (
              <div className="stat-alert warning">
                ⏰ <strong>{data.reminders.notes + data.reminders.tasks}</strong> upcoming reminder{(data.reminders.notes + data.reminders.tasks) !== 1 ? 's' : ''} in next 7 days
              </div>
            )}
          </div>
        )}

        {/* Completion progress */}
        <section className="stats-section">
          <h2 className="stats-section-title">🔥 Completion Rate</h2>
          <div className="progress-bar-wrap">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${t.completion_rate}%` }}
              />
            </div>
            <span className="progress-label">
              {t.completed_tasks} of {t.tasks} task{t.tasks !== 1 ? 's' : ''}
            </span>
          </div>
        </section>

        {/* Priority breakdown */}
        {priorityTotal > 0 && (
          <section className="stats-section">
            <h2 className="stats-section-title">📅 Tasks by Priority</h2>
            <div className="bar-list">
              {['high', 'medium', 'low'].map((p) => {
                const count = data.priority_breakdown[p]
                const pct = Math.round((count / priorityTotal) * 100)
                return (
                  <div key={p} className="bar-row">
                    <span className={`bar-label dot-${p}`}>
                      <span className={`dot ${p}`} /> {p}
                    </span>
                    <div className="bar-track">
                      <div className={`bar-fill ${p}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="bar-value">{count}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Note types */}
        {(data.note_types.text + data.note_types.image + data.note_types.file) > 0 && (
          <section className="stats-section">
            <h2 className="stats-section-title">📝 Notes by Type</h2>
            <div className="type-grid">
              <div className="type-card">
                <div className="type-icon">📄</div>
                <div className="type-count">{data.note_types.text}</div>
                <div className="type-label">Text</div>
              </div>
              <div className="type-card">
                <div className="type-icon">🖼️</div>
                <div className="type-count">{data.note_types.image}</div>
                <div className="type-label">Image</div>
              </div>
              <div className="type-card">
                <div className="type-icon">📎</div>
                <div className="type-count">{data.note_types.file}</div>
                <div className="type-label">File</div>
              </div>
            </div>
          </section>
        )}

        {/* 7-day activity chart */}
        <section className="stats-section">
          <h2 className="stats-section-title">🎯 Last 7 Days</h2>
          <div className="activity-chart">
            {data.activity_7d.map((day) => {
              const heightPct = (day.total / maxActivity) * 100
              return (
                <div key={day.date} className="activity-col">
                  <div className="activity-bar-wrap">
                    <div
                      className="activity-bar"
                      style={{ height: `${Math.max(heightPct, 3)}%` }}
                      title={`${day.total} item${day.total !== 1 ? 's' : ''}`}
                    >
                      {day.total > 0 && (
                        <span className="activity-count">{day.total}</span>
                      )}
                    </div>
                  </div>
                  <span className="activity-label">{day.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Top tags */}
        {data.top_tags.length > 0 && (
          <section className="stats-section">
            <h2 className="stats-section-title">🏷️ Top Tags</h2>
            <div className="top-tags">
              {data.top_tags.map((tag) => (
                <span key={tag.name} className="top-tag">
                  <span className="hash">#</span>{tag.name}
                  <span className="top-tag-count">{tag.count}</span>
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
