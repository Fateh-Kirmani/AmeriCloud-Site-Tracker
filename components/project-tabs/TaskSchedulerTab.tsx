'use client'
import { useState, useEffect } from 'react'
import TrashIcon from '@/components/icons/TrashIcon'
import { CrewMemberRow } from '@/types/milestone'
import { FIELD_ENGINEERS } from '@/lib/field-engineers'

const inputClass = 'w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors'
const readonlyClass = 'w-full bg-[#0D1F35] border border-[#1E3A5F] rounded-md px-3 py-2 text-[#94A3B8] text-sm cursor-not-allowed'

type MilestoneWithTasks = {
  id: string
  details: string
  tasks: { id: string; task: string }[]
}

type ScheduledRow = CrewMemberRow & { selected_milestone_id?: string }

export default function TaskSchedulerTab({ projectId, canEdit = true }: { projectId: string; canEdit?: boolean }) {
  const [rows, setRows] = useState<ScheduledRow[]>([])
  const [milestones, setMilestones] = useState<MilestoneWithTasks[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [rowAvailability, setRowAvailability] = useState<Record<number, Set<string>>>({})

  useEffect(() => {
    async function load() {
      try {
        const [crewRes, msRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/crew`),
          fetch(`/api/projects/${projectId}/milestones`),
        ])
        const crewData = await crewRes.json()
        const msData = await msRes.json()

        const ms: MilestoneWithTasks[] = (msData.milestones ?? []).map((m: { id: string; details: string | null; tasks: { id: string; task: string }[] }) => ({
          id: m.id,
          details: m.details ?? '(untitled)',
          tasks: m.tasks ?? [],
        }))
        setMilestones(ms)

        setRows((crewData.crew_members ?? []).map((m: { id: string; name: string | null; email: string | null; task: string | null; location: string | null; date_from: string | null; date_to: string | null }) => ({
          id: m.id,
          name: m.name ?? '',
          email: m.email ?? '',
          task: m.task ?? '',
          location: m.location ?? '',
          date_from: m.date_from ?? '',
          date_to: m.date_to ?? '',
          selected_milestone_id: ms.find(ms2 => ms2.tasks.some(t => t.task === m.task))?.id ?? '',
        })))
      } catch {
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  function addRow() {
    setRows(r => [...r, { name: '', email: '', task: '', location: '', date_from: '', date_to: '', selected_milestone_id: '' }])
  }

  function updateMilestone(index: number, milestoneId: string) {
    setRows(r => r.map((row, i) => i === index ? { ...row, selected_milestone_id: milestoneId, task: '' } : row))
  }

  function updateRow(index: number, field: keyof ScheduledRow, value: string) {
    setRows(prev => {
      const next = prev.map((row, i) => i === index ? { ...row, [field]: value } : row)
      if (field === 'date_from' || field === 'date_to') {
        const row = next[index]
        const df = field === 'date_from' ? value : row.date_from
        const dt = field === 'date_to' ? value : row.date_to
        if (df && dt) {
          fetch(`/api/calendar/availability?date_from=${encodeURIComponent(df)}&date_to=${encodeURIComponent(dt)}`)
            .then(r => r.ok ? r.json() : [])
            .then((data: { email: string }[]) => {
              const emails = new Set(data.map(d => d.email.toLowerCase()))
              setRowAvailability(prev2 => ({ ...prev2, [index]: emails }))
            })
            .catch(() => {})
        }
      }
      return next
    })
  }

  async function deleteRow(index: number) {
    const row = rows[index]
    setDeleteError(false)
    if (row.id) {
      setDeletingIndex(index)
      try {
        const res = await fetch(`/api/projects/${projectId}/crew/${row.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
      } catch {
        setDeletingIndex(null)
        setDeleteError(true)
        return
      }
      setDeletingIndex(null)
    }
    setRows(r => r.filter((_, i) => i !== index))
    // Shift rowAvailability keys down past the deleted index
    setRowAvailability(prev => {
      const next: Record<number, Set<string>> = {}
      Object.entries(prev).forEach(([key, val]) => {
        const k = Number(key)
        if (k < index) next[k] = val
        else if (k > index) next[k - 1] = val
      })
      return next
    })
  }

  async function save() {
    setSaving(true)
    setSaveError(false)
    setConflictError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/crew`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crew_members: rows.map(({ selected_milestone_id: _, ...r }, i) => ({ ...r, sort_order: i })),
          deleted_ids: [],
        }),
      })
      if (res.status === 409) {
        const body = await res.json()
        const first = (body.conflicts as { engineer: string; conflicting_project: string; date_from: string; date_to: string }[])?.[0]
        setConflictError(first
          ? `${first.engineer} is already scheduled on "${first.conflicting_project}" (${first.date_from} – ${first.date_to}). Resolve the conflict before saving.`
          : 'Schedule conflict detected. Check engineer availability and try again.')
        return
      }
      if (!res.ok) throw new Error()
      const { crew_members } = await res.json()
      setRows(crew_members.map((m: { id: string; name: string | null; email: string | null; task: string | null; location: string | null; date_from: string | null; date_to: string | null }) => ({
        id: m.id, name: m.name ?? '', email: m.email ?? '',
        task: m.task ?? '', location: m.location ?? '', date_from: m.date_from ?? '', date_to: m.date_to ?? '',
        selected_milestone_id: milestones.find(ms => ms.tasks.some(t => t.task === m.task))?.id ?? '',
      })))
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-[#94A3B8] text-sm">Loading...</p>
  if (fetchError) return <p className="text-[#F87171] text-sm">Failed to load. Please refresh.</p>

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-[#94A3B8] text-sm">No tasks scheduled yet.</p>}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 900 }} className="space-y-2">
          {rows.length > 0 && (
            <div className="flex gap-2 items-center px-1">
              <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Field Engineer Name</span>
              <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Email</span>
              <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Milestone</span>
              <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Select Task</span>
              <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Location</span>
              <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Date From</span>
              <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Date To</span>
              <span className="w-4 shrink-0" />
            </div>
          )}
          {rows.map((row, i) => {
            const selectedMs = milestones.find(m => m.id === row.selected_milestone_id)
            const availableTasks = selectedMs?.tasks ?? []
            const isUnavailable = !!(row.email && rowAvailability[i]?.has(row.email.toLowerCase()))
            const isDeleting = deletingIndex === i
            return (
              <div key={i} className={`space-y-0.5 transition-opacity ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex gap-2 items-center">
                  <select
                    value={row.name}
                    onChange={e => {
                      const engineer = FIELD_ENGINEERS.find(eng => eng.name === e.target.value)
                      setRows(r => r.map((row2, i2) => i2 === i ? { ...row2, name: e.target.value, email: engineer && engineer.email !== 'N/A' ? engineer.email : '' } : row2))
                    }}
                    className={`${inputClass} flex-1 ${isUnavailable ? 'border-[#F87171]' : ''}`}
                  >
                    <option value="">Select engineer...</option>
                    {FIELD_ENGINEERS.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                  </select>
                  <input value={row.email} readOnly className={`${readonlyClass} flex-1`} placeholder="Auto-filled" />
                  <select value={row.selected_milestone_id ?? ''} onChange={e => updateMilestone(i, e.target.value)} className={`${inputClass} flex-1`}>
                    <option value="">Select milestone...</option>
                    {milestones.map(m => <option key={m.id} value={m.id}>{m.details}</option>)}
                  </select>
                  <select value={row.task} onChange={e => updateRow(i, 'task', e.target.value)} className={`${inputClass} flex-1`} disabled={!row.selected_milestone_id}>
                    <option value="">{row.selected_milestone_id ? (availableTasks.length === 0 ? 'No tasks available' : 'Select task...') : 'Select milestone first'}</option>
                    {availableTasks.map(t => <option key={t.id} value={t.task}>{t.task}</option>)}
                  </select>
                  <input value={row.location} onChange={e => updateRow(i, 'location', e.target.value)} className={`${inputClass} flex-1`} placeholder="Location..." />
                  <input type="date" value={row.date_from} onChange={e => updateRow(i, 'date_from', e.target.value)} className={`${inputClass} flex-1`} />
                  <input type="date" value={row.date_to} onChange={e => updateRow(i, 'date_to', e.target.value)} className={`${inputClass} flex-1`} />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => deleteRow(i)}
                      disabled={isDeleting || deletingIndex !== null}
                      aria-label="Delete scheduled task"
                      className="text-[#94A3B8] hover:text-[#C8102E] transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
                {isUnavailable && (
                  <p className="text-[#F87171] text-xs pl-1">⚠ {row.name} already has a booking during these dates</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {deleteError && (
        <p role="alert" className="text-[#F87171] text-xs">Failed to delete row. Please try again.</p>
      )}
      <div className="flex items-center justify-between pt-2">
        {canEdit ? (
          <button type="button" onClick={addRow} className="text-[#94A3B8] hover:text-white text-sm font-medium transition-colors">Schedule A New Task</button>
        ) : <div />}
        {canEdit && (
          <div className="flex flex-col items-end gap-1">
            {conflictError && <p role="alert" className="text-[#F87171] text-xs text-right max-w-sm">{conflictError}</p>}
            {saveError && <p role="alert" className="text-[#F87171] text-xs">Failed to save. Please try again.</p>}
            <button type="button" onClick={save} disabled={saving} className="bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
