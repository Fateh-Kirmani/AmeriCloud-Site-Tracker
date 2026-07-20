'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '@/components/Toast'

type Props = {
  projectId: string
  siteName: string
  onClose: () => void
  onDeleted: () => void
}

export default function DeleteConfirmModal({ projectId, siteName, onClose, onDeleted }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function handleDelete() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.refresh()
      onDeleted()
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      {error && (
        <Toast
          message="Failed to delete project"
          type="error"
          onDismiss={() => setError(false)}
        />
      )}
      <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-white text-xl font-bold mb-3">Delete Project?</h2>
        <p className="text-[#94A3B8] mb-6">
          <span className="text-white font-semibold">{siteName}</span> will be permanently deleted.{' '}
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white transition-colors text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A50E25] text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
