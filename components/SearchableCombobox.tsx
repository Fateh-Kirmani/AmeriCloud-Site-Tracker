'use client'
import { useState, useEffect, useRef } from 'react'

export type ComboboxOption = { label: string; value: string; secondary?: string }

type Props = {
  value: string
  onSelect: (label: string, secondary?: string) => void
  options?: ComboboxOption[]
  fetchOptions?: (q: string) => Promise<ComboboxOption[]>
  placeholder?: string
  className?: string
  inputClassName?: string
}

export default function SearchableCombobox({
  value, onSelect, options, fetchOptions, placeholder, className, inputClassName,
}: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<ComboboxOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(value)
        setResults([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [value])

  function filterStatic(q: string): ComboboxOption[] {
    if (!options) return []
    if (!q.trim()) return options
    const lower = q.toLowerCase()
    return options.filter(o => o.label.toLowerCase().includes(lower))
  }

  function handleInputChange(q: string) {
    setQuery(q)
    setOpen(true)
    if (options) {
      setResults(filterStatic(q))
    } else if (fetchOptions) {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (q.trim().length < 2) { setResults([]); return }
      timerRef.current = setTimeout(async () => {
        setLoading(true)
        try { setResults(await fetchOptions(q.trim())) }
        finally { setLoading(false) }
      }, 350)
    }
  }

  function handleFocus() {
    setOpen(true)
    if (options) setResults(filterStatic(query))
  }

  function handleSelect(opt: ComboboxOption) {
    setQuery(opt.label)
    setOpen(false)
    setResults([])
    onSelect(opt.label, opt.secondary)
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <input
        value={query}
        onChange={e => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
      />
      {open && (loading || results.length > 0) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 min-w-[200px] bg-[#112240] border border-[#1E3A5F] rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-[#94A3B8] text-xs">Searching...</div>
          ) : results.map(opt => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={() => handleSelect(opt)}
              className="w-full text-left px-3 py-2 hover:bg-[#1E3A5F] transition-colors"
            >
              <div className="text-white text-sm">{opt.label}</div>
              {opt.secondary && <div className="text-[#94A3B8] text-xs">{opt.secondary}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
