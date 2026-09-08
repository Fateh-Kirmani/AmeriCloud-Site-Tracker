'use client'
import { useState, useEffect, useRef, useId } from 'react'

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
  const id = useId()
  const listboxId = `${id}-listbox`

  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<ComboboxOption[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    // reset active option when result set changes
    setActiveIndex(-1)
  }, [results])

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
    setActiveIndex(-1)
    onSelect(opt.label, opt.secondary)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault()
        handleSelect(results[activeIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setQuery(value)
      setResults([])
      setActiveIndex(-1)
    }
  }

  const isOpen = open && (loading || results.length > 0)

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <input
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        value={query}
        onChange={e => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
      />
      {isOpen && (
        <div
          role="listbox"
          id={listboxId}
          className="absolute z-50 top-full left-0 right-0 mt-1 min-w-[200px] bg-[#112240] border border-[#1E3A5F] rounded-lg shadow-xl max-h-52 overflow-y-auto"
        >
          {loading ? (
            <div role="status" aria-live="polite" className="px-3 py-2 text-[#94A3B8] text-xs">Searching…</div>
          ) : results.map((opt, idx) => (
            <button
              key={opt.value}
              id={`${id}-option-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              type="button"
              onMouseDown={() => handleSelect(opt)}
              className={`w-full text-left px-3 py-2 transition-colors ${idx === activeIndex ? 'bg-[#1E3A5F]' : 'hover:bg-[#1E3A5F]'}`}
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
