import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import './Confirm.css'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const resolverRef = useRef(null)

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setState({
        title: options.title || 'Are you sure?',
        message: options.message || '',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'danger',   // 'danger' | 'primary'
      })
    })
  }, [])

  const close = useCallback((result) => {
    setState(null)
    if (resolverRef.current) {
      resolverRef.current(result)
      resolverRef.current = null
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!state) return
    const handler = (e) => {
      if (e.key === 'Escape') close(false)
      if (e.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state, close])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state && (
        <div className="confirm-backdrop" onClick={() => close(false)}>
          <div
            className="confirm-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className={`confirm-icon ${state.variant}`}>
              {state.variant === 'danger' ? '!' : '?'}
            </div>

            <h3 className="confirm-title">{state.title}</h3>

            {state.message && (
              <p className="confirm-message">{state.message}</p>
            )}

            <div className="confirm-actions">
              <button
                className="btn-ghost"
                onClick={() => close(false)}
              >
                {state.cancelText}
              </button>
              <button
                className={`btn-${state.variant === 'danger' ? 'danger' : 'primary'}`}
                onClick={() => close(true)}
                autoFocus
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider')
  return ctx
}
