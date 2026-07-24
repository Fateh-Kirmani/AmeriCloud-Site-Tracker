'use client'
import TrashIcon from '@/components/icons/TrashIcon'
import { useState, useEffect, useRef } from 'react'
import { TeamMemberRow, MilestoneOption } from '@/types/milestone'

const inputClass =
  'w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors'

export default function TeamTab({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<TeamMemberRow[]>([])
  const [milestones, setMilestones] = useState<MilestoneOption[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const pendingDeleteRef = useRef<{ row: TeamMemberRow; index: number } | null>(null)
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current) }
  }, [])

  useEffect(() => {
    fetch(`/api/projects/${projectId}/team`)
      .then((r) => r.json())
      .then(({ team_members, milestones: ms }: { team_members: Array<{ id: string; name: string | null; task_milestone_id: string | null; date_from: string | null; date_to: string | null }>; milestones: MilestoneOption[] }) => {
        setRows(team_members.map((m) => ({
          id: m.id,
          name: m.name ?? '',
          task_milestone_id: m.task_milestone_id ?? '',
          date_from: m.date_from ?? '',
          date_to: m.date_to ?? '',
        })))
        setMilestones(ms)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [projectId])

  function addRow() {
    setRows((r) => [...r, { name: '', task_milestone_id: '', date_from: '', date_to: '' }])
  }

  function updateRow(index: number, field: keyof TeamMemberRow, value: string) {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function deleteRow(index: number) {
    const row = rows[index]
    setRows((r) => r.filter((_, i) => i !== index))
    if (pendingDeleteRef.current) {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
      if (pendingDeleteRef.current.row.id) setDeletedIds((ids) => [...ids, pendingDeleteRef.current!.row.id!])
    }
    pendingDeleteRef.current = { row, index }
    setShowUndo(true)
    pendingTimerRef.current = setTimeout(() => {
      if (pendingDeleteRef.current?.row.id) setDeletedIds((ids) => [...ids, pendingDeleteRef.current!.row.id!])
      pendingDeleteRef.current = null
      pendingTimerRef.current = null
      setShowUndo(false)
    }, 5000)
  }

  function undoDelete() {
    if (!pendingDeleteRef.current) return
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
    const { row, index } = pendingDeleteRef.current
    setRows((r) => { const next = [...r]; next.splice(Math.min(index, r.length), 0, row); return next })
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
      const res = await fetch(`/api/projects/${projectId}/team`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_members: rows.map((r) => ({ ...r, task_milestone_id: r.task_milestone_id || null })),
          deleted_ids: [...deletedIds, ...extraIds],
        }),
      })
      if (!res.ok) throw new Error()
      const { team_members } = await res.json()
      setRows(
        team_members.map((m: { id: string; name: string | null; task_milestone_id: string | null; date_from: string | null; date_to: string | null }) => ({
          id: m.id,
          name: m.name ?? '',
          task_milestone_id: m.task_milestone_id ?? '',
          date_from: m.date_from ?? '',
          date_to: m.date_to ?? '',
        }))
      )
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
      {rows.length === 0 && <p className="text-[#94A3B8] text-sm">No team members added yet.</p>}
      {rows.length > 0 && (
        <div className="flex gap-2 items-center px-1">
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Name</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Task</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Date From</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Date To</span>
          <span className="w-4 shrink-0" />
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={row.name} onChange={(e) => updateRow(i, 'name', e.target.value)} className={`${inputClass} flex-1`} placeholder="Name" />
          <select value={row.task_milestone_id ?? ''} onChange={(e) => updateRow(i, 'task_milestone_id', e.target.value)} className={`${inputClass} flex-1`}>
            <option value="">Select task...</option>
            {milestones.length === 0 ? (
              <option value="" disabled>No milestones added yet.</option>
            ) : (
              milestones.map((m) => (
                <option key={m.id} value={m.id}>{m.details ?? '(untitled)'}</option>
              ))
            )}
          </select>
          <input type="date" value={row.date_from} onChange={(e) => updateRow(i, 'date_from', e.target.value)} className={`${inputClass} flex-1`} />
          <input type="date" value={row.date_to} onChange={(e) => updateRow(i, 'date_to', e.target.value)} className={`${inputClass} flex-1`} />
          <button type="button" onClick={() => deleteRow(i)} aria-label="Delete team member" className="text-[#94A3B8] hover:text-[#C8102E] transition-colors shrink-0">
            <TrashIcon />
          </button>
        </div>
      ))}
      {showUndo && (
        <div className="flex items-center justify-between bg-[#1E3A5F] rounded-lg px-4 py-2 text-sm">
          <span className="text-[#94A3B8]">Team member deleted.</span>
          <button type="button" onClick={undoDelete} className="text-[#C8102E] hover:text-white font-medium ml-4 transition-colors">
            Undo
          </button>
        </div>
      )}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={addRow} className="text-[#94A3B8] hover:text-white text-sm font-medium transition-colors">
          + Add Team Member
        </button>
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
