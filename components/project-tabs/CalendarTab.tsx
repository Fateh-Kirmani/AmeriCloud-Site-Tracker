'use client'
import { useState, useEffect } from 'react'
import { FIELD_ENGINEERS } from '@/lib/field-engineers'

type Booking = {
  id: string
  task: string | null
  location: string | null
  date_from: string
  date_to: string
  project_id: string
  project_name: string
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PROJECT_COLORS = [
  '#C8102E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

export default function CalendarTab({ projectId: _projectId }: { projectId: string }) {
  const [selectedEmail, setSelectedEmail] = useState<string>(FIELD_ENGINEERS[0]?.email ?? '')
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  useEffect(() => {
    if (!selectedEmail || selectedEmail === 'N/A') { setBookings([]); return }
    setLoading(true)
    fetch(`/api/calendar?email=${encodeURIComponent(selectedEmail)}&month=${month}&year=${year}`)
      .then(r => r.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [selectedEmail, month, year])

  const filteredEngineers = FIELD_ENGINEERS.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedEngineer = FIELD_ENGINEERS.find(e => e.email === selectedEmail)
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })
  const todayStr = new Date().toISOString().split('T')[0]

  const projectColorMap: Record<string, string> = {}
  let colorIdx = 0
  bookings.forEach(b => {
    if (!projectColorMap[b.project_id]) {
      projectColorMap[b.project_id] = PROJECT_COLORS[colorIdx++ % PROJECT_COLORS.length]
    }
  })

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const dayMap: Record<number, Booking[]> = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    dayMap[d] = bookings.filter(b => b.date_from <= dateStr && b.date_to >= dateStr)
  }

  const weeks = cells.length / 7
  const rowHeight = Math.max(72, Math.floor(480 / weeks))

  return (
    <div className="flex border border-[#1E3A5F] rounded-xl overflow-hidden" style={{ height: 560 }}>

      {/* Left sidebar — engineer list */}
      <div className="w-52 shrink-0 border-r border-[#1E3A5F] flex flex-col bg-[#0B1929]">
        <div className="p-2.5 border-b border-[#1E3A5F]">
          <p className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium mb-2">Field Engineers</p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-[#112240] border border-[#1E3A5F] rounded-md px-2.5 py-1.5 text-white text-xs placeholder-[#8899AA] focus:outline-none focus:ring-1 focus:ring-[#C8102E] transition-colors"
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {filteredEngineers.map(fe => (
            <button
              key={fe.email}
              type="button"
              onClick={() => setSelectedEmail(fe.email)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors border-b border-[#1E3A5F]/40 ${
                selectedEmail === fe.email
                  ? 'bg-[#1E3A5F] text-white font-semibold'
                  : 'text-[#94A3B8] hover:bg-[#112240] hover:text-white'
              }`}
            >
              {fe.name}
            </button>
          ))}
        </div>
      </div>

      {/* Right — calendar */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E3A5F] bg-[#112240] shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              aria-label="Previous month"
              className="text-[#94A3B8] hover:text-white p-1 rounded hover:bg-[#1E3A5F] transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="text-white font-semibold text-sm w-34 text-center select-none" style={{ minWidth: 136 }}>
              {monthName} {year}
            </span>
            <button
              type="button"
              onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              aria-label="Next month"
              className="text-[#94A3B8] hover:text-white p-1 rounded hover:bg-[#1E3A5F] transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {selectedEngineer && (
              <span className="text-[#94A3B8] text-xs hidden sm:block truncate max-w-[180px]">
                {selectedEngineer.name}
              </span>
            )}
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="text-xs text-[#94A3B8] hover:text-white border border-[#1E3A5F] hover:border-[#94A3B8] px-2.5 py-1 rounded transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-[#1E3A5F] bg-[#0B1929] shrink-0">
          {DAY_LABELS.map(d => (
            <div key={d} className="py-1.5 text-center text-[#94A3B8] text-xs font-medium uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[#94A3B8] text-sm">Loading schedule...</p>
          </div>
        ) : selectedEmail === 'N/A' ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[#94A3B8] text-sm">No email on file for this engineer.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`e-${idx}`}
                      className={`border-r border-b border-[#1E3A5F] bg-[#0B1929]/50 ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                      style={{ height: rowHeight }}
                    />
                  )
                }

                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isToday = dateStr === todayStr
                const isWeekend = idx % 7 === 0 || idx % 7 === 6
                const dayBookings = dayMap[day] ?? []

                return (
                  <div
                    key={day}
                    className={`border-r border-b border-[#1E3A5F] p-1.5 flex flex-col gap-0.5 ${
                      idx % 7 === 6 ? 'border-r-0' : ''
                    } ${isWeekend ? 'bg-[#0B1929]/70' : 'bg-[#112240]'}`}
                    style={{ height: rowHeight }}
                  >
                    {/* Day number */}
                    <div className="flex justify-end mb-0.5 shrink-0">
                      <span
                        className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-[#C8102E] text-white' : 'text-[#94A3B8]'
                        }`}
                      >
                        {day}
                      </span>
                    </div>

                    {/* Booking blocks */}
                    {dayBookings.slice(0, 2).map((b, bi) => (
                      <div
                        key={`${b.id}-${bi}`}
                        className="rounded px-1.5 py-0.5 text-white truncate shrink-0 cursor-default"
                        style={{
                          backgroundColor: projectColorMap[b.project_id] ?? '#C8102E',
                          fontSize: 10,
                          lineHeight: '14px',
                        }}
                        title={`${b.project_name}: ${b.task ?? '—'}${b.location ? ` · ${b.location}` : ''}`}
                      >
                        {b.project_name}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <span className="text-[#94A3B8] shrink-0" style={{ fontSize: 10, lineHeight: '14px' }}>
                        +{dayBookings.length - 2} more
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
