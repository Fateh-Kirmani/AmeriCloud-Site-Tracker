'use client'
import { useState, useEffect, useRef } from 'react'
import { MilestoneRow } from '@/types/milestone'
import TrashIcon from '@/components/icons/TrashIcon'

const inputClass =
  'w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors'

export default function MilestonesTab({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<MilestoneRow[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const pendingDeleteRef = useRef<{ row: MilestoneRow; index: number } | null>(null)
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current) }
  }, [])

  useEffect(() => {
    fetch(`/api/projects/${projectId}/milestones`)
      .then((r) => r.json())
      .then((data: Array<{ id: string; details: string | null; owner: string | null; projected_date: string | null; actualized_date: string | null; notes: string | null }>) =>
        setRows(data.map((m) => ({
          id: m.id,
          details: m.details ?? '',
          owner: m.owner ?? '',
          projected_date: m.projected_date ?? '',
          actualized_date: m.actualized_date ?? '',
          notes: m.notes ?? '',
        })))
      )
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [projectId])

  function addRow() {
    setRows((r) => [...r, { details: '', owner: '', projected_date: '', actualized_date: '', notes: '' }])
  }

  function updateRow(index: number, field: keyof MilestoneRow, value: string) {
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
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestones: rows, deleted_ids: [...deletedIds, ...extraIds] }),
      })
      if (!res.ok) throw new Error()
      const { milestones } = await res.json()
      setRows(
        milestones.map((m: { id: string; details: string | null; owner: string | null; projected_date: string | null; actualized_date: string | null; notes: string | null }) => ({
          id: m.id,
          details: m.details ?? '',
          owner: m.owner ?? '',
          projected_date: m.projected_date ?? '',
          actualized_date: m.actualized_date ?? '',
          notes: m.notes ?? '',
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
      {rows.length === 0 && <p className="text-[#94A3B8] text-sm">No milestones added yet.</p>}
      {rows.length > 0 && (
        <div className="flex gap-2 items-center px-1">
          <span className="flex-[2] text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Milestone Details</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Owner</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Projected Date</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Actual Date</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Notes</span>
          <span className="w-4 shrink-0" />
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={row.details} onChange={(e) => updateRow(i, 'details', e.target.value)} className={`${inputClass} flex-[2]`} placeholder="Milestone details" />
          <input value={row.owner} onChange={(e) => updateRow(i, 'owner', e.target.value)} className={`${inputClass} flex-1`} placeholder="Owner" />
          <input type="date" value={row.projected_date} onChange={(e) => updateRow(i, 'projected_date', e.target.value)} className={`${inputClass} flex-1`} />
          <input type="date" value={row.actualized_date} onChange={(e) => updateRow(i, 'actualized_date', e.target.value)} className={`${inputClass} flex-1`} />
          <input value={row.notes} onChange={(e) => updateRow(i, 'notes', e.target.value)} className={`${inputClass} flex-1`} placeholder="Notes" />
          <button type="button" onClick={() => deleteRow(i)} aria-label="Delete milestone" className="text-[#94A3B8] hover:text-[#C8102E] transition-colors shrink-0">
            <TrashIcon />
          </button>
        </div>
      ))}
      {showUndo && (
        <div className="flex items-center justify-between bg-[#1E3A5F] rounded-lg px-4 py-2 text-sm">
          <span className="text-[#94A3B8]">Milestone deleted.</span>
          <button type="button" onClick={undoDelete} className="text-[#C8102E] hover:text-white font-medium ml-4 transition-colors">
            Undo
          </button>
        </div>
      )}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={addRow} className="text-[#94A3B8] hover:text-white text-sm font-medium transition-colors">
          + Add Milestone
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
