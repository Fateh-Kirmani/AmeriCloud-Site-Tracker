'use client'
import Image from 'next/image'
import { useSidebar } from '@/components/SidebarProvider'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const { sidebarOpen, toggleSidebar } = useSidebar()
  const { data: session } = useSession()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B1929] border-b border-[#1E3A5F] shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={sidebarOpen}
          className="text-[#94A3B8] hover:text-white transition-colors p-1 -ml-1 shrink-0"
        >
          {sidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
        <Image
          src="/americloud_telecom_solutions_logo.jpg"
          alt="AmeriCloud Telecom Solutions"
          width={160}
          height={40}
          style={{ height: '40px', width: 'auto' }}
          priority
        />
        <div className="w-px h-8 bg-[#1E3A5F]" />
        <span className="text-white font-semibold text-lg tracking-wide">
          AmeriCloud Project Tracker
        </span>

        {session?.user && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[#94A3B8] text-sm hidden sm:block truncate max-w-[200px]">
              {session.user.name ?? session.user.email}
            </span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-[#94A3B8] hover:text-white text-xs font-medium transition-colors border border-[#1E3A5F] hover:border-white px-3 py-1.5 rounded-lg shrink-0"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
