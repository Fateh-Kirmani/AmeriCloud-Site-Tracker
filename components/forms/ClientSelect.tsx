'use client'
import { useState, useRef, useEffect } from 'react'
import { CLIENTS } from '@/lib/clients'

type Props = {
  value: string
  onChange: (val: string) => void
  error?: string
}

export default function ClientSelect({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = CLIENTS.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleSelect(client: string) {
    onChange(client)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Client"
        onClick={() => setOpen(!open)}
        className={`w-full bg-[#0B1929] border ${
          error ? 'border-[#F87171]' : 'border-[#1E3A5F]'
        } rounded-md px-3 py-2.5 text-left flex items-center justify-between text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors`}
      >
        <span className={value ? 'text-white' : 'text-[#8899AA]'}>
          {value || 'Select client...'}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-[#94A3B8] shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="bg-[#112240] border border-[#1E3A5F] rounded-md shadow-lg max-h-56 overflow-y-auto absolute z-50 w-full mt-1">
          <div className="p-2 sticky top-0 bg-[#112240]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#0B1929] border border-[#1E3A5F] rounded px-3 py-1.5 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:ring-1 focus:ring-[#C8102E]"
            />
          </div>
          <ul role="listbox" aria-label="Clients">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[#94A3B8]">No results</li>
            ) : (
              filtered.map((c) => (
                <li
                  key={c}
                  role="option"
                  aria-selected={c === value}
                  onClick={() => handleSelect(c)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#1E3A5F] ${
                    c === value ? 'text-white' : 'text-[#94A3B8]'
                  }`}
                >
                  {c}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
