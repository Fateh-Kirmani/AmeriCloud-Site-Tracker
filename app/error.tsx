'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0B1929] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-[#94A3B8] text-lg mb-6">Something went wrong. Please try again.</p>
        <button
          onClick={reset}
          className="bg-[#C8102E] hover:bg-[#A50E25] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
