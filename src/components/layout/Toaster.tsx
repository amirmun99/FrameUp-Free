import { create } from 'zustand'
import { useEffect } from 'react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastState {
  toasts: Toast[]
  add: (type: Toast['type'], message: string) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (type, message) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}))

// Convenience functions
export const toast = {
  success: (message: string) => useToastStore.getState().add('success', message),
  error: (message: string) => useToastStore.getState().add('error', message),
  info: (message: string) => useToastStore.getState().add('info', message)
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const el = document.getElementById(`toast-${t.id}`)
    if (el) {
      el.style.transform = 'translateX(100%)'
      el.style.opacity = '0'
      requestAnimationFrame(() => {
        el.style.transition = 'transform 180ms ease-out, opacity 180ms ease-out'
        el.style.transform = 'translateX(0)'
        el.style.opacity = '1'
      })
    }
  }, [t.id])

  const bgColor =
    t.type === 'success'
      ? 'bg-success'
      : t.type === 'error'
        ? 'bg-danger'
        : 'bg-primary'

  return (
    <div
      id={`toast-${t.id}`}
      className={`${bgColor} rounded-lg px-4 py-2.5 text-sm text-white shadow-lg cursor-pointer`}
      onClick={onDismiss}
    >
      {t.message}
    </div>
  )
}

export function Toaster() {
  const { toasts, remove } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-12 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
      ))}
    </div>
  )
}
