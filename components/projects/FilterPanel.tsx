'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const CLIENTS = ['AT&T', 'Verizon', 'T-Mobile', 'Crown Castle', 'SBA Communications']
const AMERICLOUD_PMS = ['John Smith', 'Sarah Johnson', 'Mike Davis']
const PROJECT_TEMPLATES = ['Standard Cell Tower', 'Small Cell', 'DAS', 'Rooftop']

function selectClass() {
  return 'bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent w-full'
}

type Props = {
  initialSearch: string
  initialClient: string
  initialTemplate: string
  initialPm: string
  initialFrom: string
  initialTo: string
}

export default function FilterPanel({
  initialSearch,
  initialClient,
  initialTemplate,
  initialPm,
  initialFrom,
  initialTo,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [client, setClient] = useState(initialClient)
  const [template, setTemplate] = useState(initialTemplate)
  const [pm, setPm] = useState(initialPm)
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    const values: Record<string, string> = { search, client, template, pm, from, to, ...overrides }
    Object.entries(values).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    return `/?${params.toString()}` === '/?' ? '/' : `/?${params.toString()}`
  }

  function handleSearch(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ search: value }))
    }, 300)
  }

  function handleDropdown(key: string, value: string, setter: (v: string) => void) {
    setter(value)
    router.push(buildUrl({ [key]: value }))
  }

  function clearFilters() {
    setSearch('')
    setClient('')
    setTemplate('')
    setPm('')
    setFrom('')
    setTo('')
    router.push('/')
  }

  const hasFilters = search || client || template || pm || from || to

  return (
    <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="xl:col-span-2">
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#4A6FA5] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent w-full"
          />
        </div>

        <div>
          <select
            aria-label="Client"
            value={client}
            onChange={(e) => handleDropdown('client', e.target.value, setClient)}
            className={selectClass()}
          >
            <option value="">All Clients</option>
            {CLIENTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <select
            aria-label="Template"
            value={template}
            onChange={(e) => handleDropdown('template', e.target.value, setTemplate)}
            className={selectClass()}
          >
            <option value="">All Templates</option>
            {PROJECT_TEMPLATES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <select
            aria-label="AmeriCloud PM"
            value={pm}
            onChange={(e) => handleDropdown('pm', e.target.value, setPm)}
            className={selectClass()}
          >
            <option value="">All PMs</option>
            {AMERICLOUD_PMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#94A3B8] hover:text-white transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3 sm:grid-cols-4 lg:w-1/2">
        <div>
          <label className="text-[#94A3B8] text-xs uppercase tracking-wider block mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => handleDropdown('from', e.target.value, setFrom)}
            className="bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent w-full"
          />
        </div>
        <div>
          <label className="text-[#94A3B8] text-xs uppercase tracking-wider block mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => handleDropdown('to', e.target.value, setTo)}
            className="bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent w-full"
          />
        </div>
      </div>
    </div>
  )
}
