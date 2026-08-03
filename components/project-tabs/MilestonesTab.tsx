'use client'
import { useState, useEffect, useRef } from 'react'
import { CSSProperties } from 'react'
import { MilestoneRow } from '@/types/milestone'
import TrashIcon from '@/components/icons/TrashIcon'

const inputClass =
  'w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors'

function getProjectedDateStyle(projectedDate: string, actualizedDate: string): CSSProperties {
  if (!projectedDate) return {}
  const today = new Date().toISOString().split('T')[0]
  if (actualizedDate) {
    if (actualizedDate <= projectedDate) return { color: '#4ade80' }
    return {}
  }
  if (projectedDate < today) return { color: '#f87171' }
  return {}
}

type Props = {
  projectId: string
  projectTemplate?: string | null
  templates?: { name: string; items: { details: string | null; notes: string | null; sort_order: number }[] }[]
}

export default function MilestonesTab({ projectId, projectTemplate, templates }: Props) {
  const [rows, setRows] = useState<MilestoneRow[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateSaveError, setTemplateSaveError] = useState('')
  const [projectNotes, setProjectNotes] = useState('')
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const pendingDeleteRef = useRef<{ row: MilestoneRow; index: number } | null>(null)
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current) }
  }, [])

  useEffect(() => {
    async function fetchMilestones() {
      const r = await fetch(`/api/projects/${projectId}/milestones`)
      const { milestones: data, project_notes: pNotes }: {
        milestones: Array<{ id: string; details: string | null; owner: string | null; projected_date: string | null; actualized_date: string | null; notes: string | null }>
        project_notes: string
      } = await r.json()

      setProjectNotes(pNotes ?? '')

      if (data.length === 0 && projectTemplate) {
        const tmpl = (templates ?? []).find(t => t.name === projectTemplate)
        if (tmpl && tmpl.items.length > 0) {
          const preFilled = tmpl.items
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(item => ({
              details: item.details ?? '',
              owner: '',
              projected_date: '',
              actualized_date: '',
              notes: item.notes ?? '',
            }))
          setRows(preFilled)
          try {
            const res = await fetch(`/api/projects/${projectId}/milestones`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ milestones: preFilled, deleted_ids: [] }),
            })
            if (res.ok) {
              const { milestones } = await res.json()
              setRows(milestones.map((m: { id: string; details: string | null; owner: string | null; projected_date: string | null; actualized_date: string | null; notes: string | null }) => ({
                id: m.id,
                details: m.details ?? '',
                owner: m.owner ?? '',
                projected_date: m.projected_date ?? '',
                actualized_date: m.actualized_date ?? '',
                notes: m.notes ?? '',
              })))
            }
          } catch {}
          return
        }
      }

      setRows(data.map((m) => ({
        id: m.id,
        details: m.details ?? '',
        owner: m.owner ?? '',
        projected_date: m.projected_date ?? '',
        actualized_date: m.actualized_date ?? '',
        notes: m.notes ?? '',
      })))
    }

    async function fetchTeam() {
      const r = await fetch(`/api/projects/${projectId}/team`)
      const { team_members } = await r.json()
      setTeamMembers((team_members as Array<{ name: string | null }>).map((m) => m.name ?? '').filter(Boolean))
    }

    async function load() {
      try {
        await Promise.all([fetchMilestones(), fetchTeam()])
      } catch {
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

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
        body: JSON.stringify({
          milestones: rows.map((r, i) => ({ ...r, sort_order: i })),
          deleted_ids: [...deletedIds, ...extraIds],
          project_notes: projectNotes,
        }),
      })
      if (!res.ok) throw new Error()
      const { milestones, project_notes: pNotes } = await res.json()
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
      setProjectNotes(pNotes ?? '')
      setDeletedIds([])
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  async function saveAsTemplate() {
    if (!templateName.trim()) return
    setSavingTemplate(true)
    setTemplateSaveError('')
    try {
      const res = await fetch('/api/milestone-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          items: rows.map(r => ({ details: r.details, notes: r.notes })),
        }),
      })
      if (res.status === 409) {
        setTemplateSaveError('A template with that name already exists.')
        return
      }
      if (!res.ok) {
        setTemplateSaveError('Failed to save template.')
        return
      }
      setShowTemplateModal(false)
      setTemplateName('')
    } catch {
      setTemplateSaveError('Failed to save template.')
    } finally {
      setSavingTemplate(false)
    }
  }

  if (loading) return <p className="text-[#94A3B8] text-sm">Loading...</p>
  if (fetchError) return <p className="text-[#F87171] text-sm">Failed to load. Please refresh.</p>

  return (
    <>
      <div className="flex gap-6 items-start">
        {/* Left: milestone table */}
        <div className="flex-1 min-w-0 space-y-3">
          {rows.length === 0 && <p className="text-[#94A3B8] text-sm">No milestones added yet.</p>}
          {rows.length > 0 && (
            <div className="flex gap-2 items-center px-1">
              <span className="w-5 shrink-0" />
              <span className="flex-[2] text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Milestone Details</span>
              <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Owner</span>
              <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Projected Date</span>
              <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Actual Date</span>
              <span className="flex-1 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Notes</span>
              <span className="w-4 shrink-0" />
            </div>
          )}
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex gap-2 items-center"
              draggable={true}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragIndex !== null && dragIndex !== i) {
                  const newRows = [...rows]
                  const [dragged] = newRows.splice(dragIndex, 1)
                  newRows.splice(i, 0, dragged)
                  setRows(newRows)
                  setDragIndex(i)
                }
              }}
              onDragEnd={() => setDragIndex(null)}
            >
              <button
                type="button"
                className="cursor-grab text-[#94A3B8] hover:text-white shrink-0"
                draggable={false}
              >
                <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                  <circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/>
                  <circle cx="3" cy="8" r="1.5"/><circle cx="9" cy="8" r="1.5"/>
                  <circle cx="3" cy="13" r="1.5"/><circle cx="9" cy="13" r="1.5"/>
                </svg>
              </button>
              <input value={row.details} onChange={(e) => updateRow(i, 'details', e.target.value)} className={`${inputClass} flex-[2]`} placeholder="Milestone details" />
              <select value={row.owner} onChange={(e) => updateRow(i, 'owner', e.target.value)} className={`${inputClass} flex-1`}>
                <option value="">— Select —</option>
                {row.owner && !teamMembers.includes(row.owner) && <option value={row.owner}>{row.owner}</option>}
                {teamMembers.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <input
                type="date"
                value={row.projected_date}
                onChange={(e) => updateRow(i, 'projected_date', e.target.value)}
                className={`${inputClass} flex-1`}
                style={getProjectedDateStyle(row.projected_date, row.actualized_date)}
              />
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
            <div className="flex items-center gap-3">
              <button type="button" onClick={addRow} className="text-[#94A3B8] hover:text-white text-sm font-medium transition-colors">
                + Add Milestone
              </button>
            </div>
            <div className="flex items-center gap-3">
              {saveError && <p className="text-[#F87171] text-xs">Failed to save. Please try again.</p>}
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                disabled={rows.length === 0}
                className="bg-[#F5C518] hover:bg-[#D4A800] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B1929] font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest"
              >
                Save As Template
              </button>
              <button type="button" onClick={save} disabled={saving} className="bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Project Notes */}
        <div className="w-64 shrink-0 flex flex-col gap-1.5">
          <span className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Project Notes</span>
          <textarea
            value={projectNotes}
            onChange={(e) => {
              setProjectNotes(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }}
            ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
            placeholder="Add project notes..."
            className={`${inputClass} resize-none overflow-hidden`}
            style={{ minHeight: '120px' }}
            rows={4}
          />
        </div>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-white font-semibold mb-4">Save As Template</h3>
            <input
              type="text"
              value={templateName}
              onChange={e => { setTemplateName(e.target.value); setTemplateSaveError('') }}
              placeholder="Template name..."
              className={inputClass}
              autoFocus
            />
            {templateSaveError && <p className="text-[#F87171] text-xs mt-1">{templateSaveError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setShowTemplateModal(false); setTemplateName(''); setTemplateSaveError('') }}
                className="flex-1 border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white rounded-lg py-2.5 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAsTemplate}
                disabled={savingTemplate || !templateName.trim()}
                className="flex-1 bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {savingTemplate ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
