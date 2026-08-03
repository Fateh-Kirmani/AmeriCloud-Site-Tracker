'use client'
import { useState, useRef, MutableRefObject } from 'react'
import { useRouter } from 'next/navigation'
import { STATUS_VALUES } from '@/types/project'
import { CLIENTS } from '@/lib/clients'

const AMERICLOUD_PMS = ['John Smith', 'Sarah Johnson', 'Mike Davis']

const SELECT_CLASS = 'bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent w-full'
const INPUT_CLASS = 'bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent w-full'

type Props = {
  initialSearch: string
  initialProjectCode: string
  initialClient: string
  initialTemplate: string
  initialPm: string
  initialStatus: string
  initialDate: string
  initialCity?: string
  initialZip?: string
  templates?: { id: string; name: string }[]
}

export default function FilterPanel({
  initialSearch,
  initialProjectCode,
  initialClient,
  initialTemplate,
  initialPm,
  initialStatus,
  initialDate,
  initialCity = '',
  initialZip = '',
  templates = [],
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const searchRef = useRef(initialSearch)
  const [projectCode, setProjectCode] = useState(initialProjectCode)
  const projectCodeRef = useRef(initialProjectCode)
  const [city, setCity] = useState(initialCity)
  const cityRef = useRef(initialCity)
  const [zip, setZip] = useState(initialZip)
  const zipRef = useRef(initialZip)
  const [client, setClient] = useState(initialClient)
  const clientRef = useRef(initialClient)
  const [template, setTemplate] = useState(initialTemplate)
  const templateRef = useRef(initialTemplate)
  const [pm, setPm] = useState(initialPm)
  const pmRef = useRef(initialPm)
  const [status, setStatus] = useState(initialStatus)
  const statusRef = useRef(initialStatus)
  const [date, setDate] = useState(initialDate)
  const dateRef = useRef(initialDate)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    const values: Record<string, string> = {
      search: searchRef.current,
      project_code: projectCodeRef.current,
      city: cityRef.current,
      zip: zipRef.current,
      client: clientRef.current,
      template: templateRef.current,
      pm: pmRef.current,
      status: statusRef.current,
      date: dateRef.current,
      ...overrides,
    }
    Object.entries(values).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    const qs = params.toString()
    return qs ? `/?${qs}` : '/'
  }

  function handleDebounced(key: string, value: string, setter: (v: string) => void, ref: MutableRefObject<string>) {
    ref.current = value
    setter(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ [key]: value }))
    }, 300)
  }

  function handleDropdown(
    key: string,
    value: string,
    setter: (v: string) => void,
    ref: MutableRefObject<string>
  ) {
    ref.current = value
    setter(value)
    router.push(buildUrl({ [key]: value }))
  }

  function clearFilters() {
    searchRef.current = ''
    projectCodeRef.current = ''
    cityRef.current = ''
    zipRef.current = ''
    clientRef.current = ''
    templateRef.current = ''
    pmRef.current = ''
    statusRef.current = ''
    dateRef.current = ''
    setSearch('')
    setProjectCode('')
    setCity('')
    setZip('')
    setClient('')
    setTemplate('')
    setPm('')
    setStatus('')
    setDate('')
    router.push('/')
  }

  const hasFilters = search || projectCode || city || zip || client || template || pm || status || date

  return (
    <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2">
          <input
            type="text"
            aria-label="Search projects"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => handleDebounced('search', e.target.value, setSearch, searchRef)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <input
            type="text"
            aria-label="Project code"
            placeholder="Project code..."
            value={projectCode}
            onChange={(e) => handleDebounced('project_code', e.target.value, setProjectCode, projectCodeRef)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <input
            type="text"
            aria-label="City"
            placeholder="City..."
            value={city}
            onChange={(e) => handleDebounced('city', e.target.value, setCity, cityRef)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <input
            type="text"
            aria-label="ZIP Code"
            placeholder="ZIP code..."
            value={zip}
            onChange={(e) => handleDebounced('zip', e.target.value, setZip, zipRef)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <select
            aria-label="Client"
            value={client}
            onChange={(e) => handleDropdown('client', e.target.value, setClient, clientRef)}
            className={SELECT_CLASS}
          >
            <option value="">All Clients</option>
            {CLIENTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <select
            aria-label="Template"
            value={template}
            onChange={(e) => handleDropdown('template', e.target.value, setTemplate, templateRef)}
            className={SELECT_CLASS}
          >
            <option value="">All Templates</option>
            {templates.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <select
            aria-label="PM"
            value={pm}
            onChange={(e) => handleDropdown('pm', e.target.value, setPm, pmRef)}
            className={SELECT_CLASS}
          >
            <option value="">All PMs</option>
            {AMERICLOUD_PMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => handleDropdown('status', e.target.value, setStatus, statusRef)}
            className={SELECT_CLASS}
          >
            <option value="">All Statuses</option>
            {STATUS_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="filter-date"
            type="date"
            aria-label="Date"
            value={date}
            onChange={(e) => handleDropdown('date', e.target.value, setDate, dateRef)}
            className={`${SELECT_CLASS} flex-1`}
          />
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-[#94A3B8] hover:text-white transition-colors whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
