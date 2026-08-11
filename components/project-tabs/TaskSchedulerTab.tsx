'use client'
import { useState, useEffect, useRef } from 'react'
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

export default function TaskSchedulerTab({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<ScheduledRow[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [milestones, setMilestones] = useState<MilestoneWithTasks[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const pendingDeleteRef = useRef<{ row: ScheduledRow; index: number } | null>(null)
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current) }
  }, [])

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

        setRows((crewData.crew_members ?? []).map((m: { id: string; name: string | null; email: string | null; task: string | null; date_from: string | null; date_to: string | null }) => ({
          id: m.id,
          name: m.name ?? '',
          email: m.email ?? '',
          task: m.task ?? '',
          date_from: m.date_from ?? '',
          date_to: m.date_to ?? '',
          selected_milestone_id: '',
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
    setRows(r => [...r, { name: '', email: '', task: '', date_from: '', date_to: '', selected_milestone_id: '' }])
  }

  function updateEngineer(index: number, name: string) {
    const eng = FIELD_ENGINEERS.find(e => e.name === name)
    setRows(r => r.map((row, i) => i === index ? { ...row, name, email: eng?.email ?? '' } : row))
  }

  function updateMilestone(index: number, milestoneId: string) {
    setRows(r => r.map((row, i) => i === index ? { ...row, selected_milestone_id: milestoneId, task: '' } : row))
  }

  function updateRow(index: number, field: keyof ScheduledRow, value: string) {
    setRows(r => r.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  function deleteRow(index: number) {
    const row = rows[index]
    setRows(r => r.filter((_, i) => i !== index))
    if (pendingDeleteRef.current) {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
      if (pendingDeleteRef.current.row.id) setDeletedIds(ids => [...ids, pendingDeleteRef.current!.row.id!])
    }
    pendingDeleteRef.current = { row, index }
    setShowUndo(true)
    pendingTimerRef.current = setTimeout(() => {
      if (pendingDeleteRef.current?.row.id) setDeletedIds(ids => [...ids, pendingDeleteRef.current!.row.id!])
      pendingDeleteRef.current = null
      pendingTimerRef.current = null
      setShowUndo(false)
    }, 5000)
  }

  function undoDelete() {
    if (!pendingDeleteRef.current) return
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
    const { row, index } = pendingDeleteRef.current
    setRows(r => { const next = [...r]; next.splice(Math.min(index, r.length), 0, row); return next })
    pendingDeleteRef.current = null
    pendingTimerRef.current = null
    setShowUndo(false)
  }

  async function save() {
    let extraIds: string[] = []
    if (pendingDeleteRef.current) {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
      if (pendingDeleteRef.current.row.id) extraIds = [pendingDeleteRef.current.row.id]
      pendingDeleteRef.current = null
      pendingTimerRef.current = null
      setShowUndo(false)
    }
    setSaving(true)
    setSaveError(false)
    try {
      const res = await fetch(`/api/projects/${projectId}/crew`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crew_members: rows.map((r, i) => ({ ...r, sort_order: i })),
          deleted_ids: [...deletedIds, ...extraIds],
        }),
      })
      if (!res.ok) throw new Error()
      const { crew_members } = await res.json()
      setRows(crew_members.map((m: { id: string; name: string | null; email: string | null; task: string | null; date_from: string | null; date_to: string | null }) => ({
        id: m.id, name: m.name ?? '', email: m.email ?? '',
        task: m.task ?? '', date_from: m.date_from ?? '', date_to: m.date_to ?? '',
        selected_milestone_id: '',
      })))
      setDeletedIds([])
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
      {rows.length > 0 && (
        <div className="flex gap-2 items-center px-1">
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Field Engineer Name</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Email</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Milestone</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Select Task</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Date From</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Date To</span>
          <span className="w-4 shrink-0" />
        </div>
      )}
      {rows.map((row, i) => {
        const selectedMs = milestones.find(m => m.id === row.selected_milestone_id)
        const availableTasks = selectedMs?.tasks ?? []
        return (
          <div key={i} className="flex gap-2 items-center">
            <select value={row.name} onChange={e => updateEngineer(i, e.target.value)} className={`${inputClass} flex-1`}>
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
            <input type="date" value={row.date_from} onChange={e => updateRow(i, 'date_from', e.target.value)} className={`${inputClass} flex-1`} />
            <input type="date" value={row.date_to} onChange={e => updateRow(i, 'date_to', e.target.value)} className={`${inputClass} flex-1`} />
            <button type="button" onClick={() => deleteRow(i)} aria-label="Delete scheduled task" className="text-[#94A3B8] hover:text-[#C8102E] transition-colors shrink-0">
              <TrashIcon />
            </button>
          </div>
        )
      })}
      {showUndo && (
        <div className="flex items-center justify-between bg-[#1E3A5F] rounded-lg px-4 py-2 text-sm">
          <span className="text-[#94A3B8]">Scheduled task deleted.</span>
          <button type="button" onClick={undoDelete} className="text-[#C8102E] hover:text-white font-medium ml-4 transition-colors">Undo</button>
        </div>
      )}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={addRow} className="text-[#94A3B8] hover:text-white text-sm font-medium transition-colors">Schedule A New Task</button>
        <div className="flex flex-col items-end gap-1">
          {saveError && <p className="text-[#F87171] text-xs">Failed to save. Please try again.</p>}
          <button type="button" onClick={save} disabled={saving} className="bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
