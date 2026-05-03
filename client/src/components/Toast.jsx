import { useState, useCallback, useEffect, useRef } from 'react'

const ICONS = {
  info:    '💬',
  success: '✅',
  warning: '⚠️',
}

/** Single toast item — auto-dismisses after `duration` ms */
function ToastItem({ id, message, type = 'info', onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10)
    // Start exit
    const exitTimer  = setTimeout(() => setVisible(false), 2700)
    // Remove after fade
    const doneTimer  = setTimeout(() => onDone(id), 3200)
    return () => [enterTimer, exitTimer, doneTimer].forEach(clearTimeout)
  }, [id, onDone])

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg
        bg-slate-800 text-white text-sm font-medium max-w-xs
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <span>{ICONS[type] ?? ICONS.info}</span>
      <span>{message}</span>
    </div>
  )
}

/** Container — renders in bottom-right corner */
export function ToastContainer({ toasts, onDone }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onDone={onDone} />
      ))}
    </div>
  )
}

/** Hook — returns [toasts, showToast] */
export function useToast() {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const showToast = useCallback((message, type = 'info') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, showToast, removeToast }
}
