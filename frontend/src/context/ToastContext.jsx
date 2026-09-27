import { createContext, useCallback, useContext, useState } from 'react'
import './Toast.css'

const ToastContext = createContext(null)

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const toast = {
    success: (msg, dur) => show(msg, 'success', dur),
    error: (msg, dur) => show(msg, 'error', dur),
    warning: (msg, dur) => show(msg, 'warning', dur),
    info: (msg, dur) => show(msg, 'info', dur),
    dismiss,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">
              {t.type === 'success' && '✓'}
              {t.type === 'error' && '✕'}
              {t.type === 'warning' && '⚠'}
              {t.type === 'info' && 'ⓘ'}
            </span>
            <span className="toast-message">{t.message}</span>
            <button
              className="toast-close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
            <div className="toast-progress" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
