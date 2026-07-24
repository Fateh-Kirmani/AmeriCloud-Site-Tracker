'use client'
import { useState, useEffect } from 'react'
import { MilestoneRow } from '@/types/milestone'

const inputClass =
  'w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#4A6FA5] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors'

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}

export default function MilestonesTab({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<MilestoneRow[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [saveError, setSaveError] = useState(false)

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
    if (row.id) setDeletedIds((ids) => [...ids, row.id!])
    setRows((r) => r.filter((_, i) => i !== index))
  }

  async function save() {
    setSaving(true)
    setSaveError(false)
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestones: rows, deleted_ids: deletedIds }),
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
  if (fetchError) return <p className="text-[#C8102E] text-sm">Failed to load. Please refresh.</p>

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-[#94A3B8] text-sm">No milestones added yet.</p>}
      {rows.length > 0 && (
        <div className="flex gap-2 items-center px-1">
          <span className="flex-[2] text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Milestone Details</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Owner</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Projected Date</span>
          <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Actualized Date</span>
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
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={addRow} className="text-[#94A3B8] hover:text-white text-sm font-medium transition-colors">
          + Add Milestone
        </button>
        <div className="flex flex-col items-end gap-1">
          {saveError && <p className="text-[#C8102E] text-xs">Failed to save. Please try again.</p>}
          <button type="button" onClick={save} disabled={saving} className="bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
