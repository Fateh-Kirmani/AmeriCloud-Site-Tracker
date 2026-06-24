'use client'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const ms = type === 'success' ? 4000 : 5000
    const timer = setTimeout(onDismiss, ms)
    return () => clearTimeout(timer)
  }, [type, onDismiss])

  const bg = type === 'success' ? 'bg-[#0D3B26]' : 'bg-[#5C1010]'
  const icon = type === 'success' ? '✓' : '✕'

  return (
    <div
      role="alert"
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-4 rounded-lg shadow-2xl text-white text-sm font-medium border border-[#1E3A5F] animate-slide-in ${bg}`}
    >
      <span className="text-base">{icon}</span>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
