'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/components/SidebarProvider'

const NAV_ITEMS = [
  {
    label: 'Projects',
    href: '/',
    exact: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    label: 'New Project',
    href: '/projects/new',
    exact: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { sidebarOpen, closeSidebar } = useSidebar()
  const pathname = usePathname()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSidebar()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeSidebar])

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          aria-hidden="true"
          onClick={closeSidebar}
        />
      )}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 left-0 bottom-0 w-[260px] z-[60] bg-[#112240] border-r border-[#1E3A5F] flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E3A5F]">
          <Image
            src="/americloud_telecom_solutions_logo.jpg"
            alt="AmeriCloud Telecom Solutions"
            width={120}
            height={30}
            style={{ height: '30px', width: 'auto' }}
          />
          <button
            onClick={closeSidebar}
            aria-label="Close navigation"
            className="text-[#94A3B8] hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col py-4 gap-1">
          {NAV_ITEMS.map(({ label, href, exact, icon }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                  isActive
                    ? 'border-[#C8102E] bg-[#0B1929] text-white'
                    : 'border-transparent text-[#94A3B8] hover:bg-[#1E3A5F] hover:text-white'
                }`}
              >
                {icon}
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
