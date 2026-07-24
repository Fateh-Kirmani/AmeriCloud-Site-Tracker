'use client'
import { useState, useEffect } from 'react'
import { TeamMemberRow, MilestoneOption } from '@/types/milestone'

const inputClass =
  'w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#4A6FA5] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors'

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}

export default function TeamTab({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<TeamMemberRow[]>([])
  const [milestones, setMilestones] = useState<MilestoneOption[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [saveError, setSaveError] = useState(false)

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
    if (row.id) setDeletedIds((ids) => [...ids, row.id!])
    setRows((r) => r.filter((_, i) => i !== index))
  }

  async function save() {
    setSaving(true)
    setSaveError(false)
    try {
      const res = await fetch(`/api/projects/${projectId}/team`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_members: rows.map((r) => ({ ...r, task_milestone_id: r.task_milestone_id || null })),
          deleted_ids: deletedIds,
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
  if (fetchError) return <p className="text-[#C8102E] text-sm">Failed to load. Please refresh.</p>

  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="text-[#94A3B8] text-sm">No team members added yet.</p>}
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
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={addRow} className="text-[#94A3B8] hover:text-white text-sm font-medium transition-colors">
          + Add Team Member
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
