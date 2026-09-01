'use client'
import { Fragment, useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import TrashIcon from '@/components/icons/TrashIcon'
import { MilestoneRow, MilestoneTask, ProjectNote } from '@/types/milestone'
import { MANAGERS } from '@/lib/managers'

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  )
}

const cellInput = 'w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-2 py-2 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors'
const cellReadonly = 'w-full bg-[#0D1F35] border border-[#1E3A5F] rounded-md px-2 py-2 text-[#94A3B8] text-sm cursor-not-allowed'
const modalInput = 'w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors'

type Props = {
  projectId: string
  projectTemplate?: string | null
  templates?: { name: string; items: { details: string | null; notes: string | null; sort_order: number; tasks?: { task: string }[] }[] }[]
}

function getProjectedDateStyle(projected: string, actualized: string): React.CSSProperties {
  if (!projected) return {}
  const today = new Date().toISOString().split('T')[0]
  if (actualized) return actualized <= projected ? { color: '#4ade80' } : { color: '#f87171' }
  return projected < today ? { color: '#f87171' } : {}
}

export default function MilestonesTab({ projectId, projectTemplate, templates }: Props) {
  const { data: session } = useSession()
  const [rows, setRows] = useState<MilestoneRow[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Inline task expansion — all expanded by default
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set())
  const [editingTasks, setEditingTasks] = useState<Record<number, MilestoneTask[]>>({})
  const [savingTasks, setSavingTasks] = useState<Set<number>>(new Set())
  // Notes popup modal (milestone notes or task notes)
  const [notesModal, setNotesModal] = useState<{ kind: 'milestone'; rowIndex: number } | { kind: 'task'; rowIndex: number; taskIndex: number } | null>(null)
  const [notesModalText, setNotesModalText] = useState('')

  // Notes
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [deletingNote, setDeletingNote] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteText, setEditNoteText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Template modal
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateSaveError, setTemplateSaveError] = useState('')

  const pendingDeleteRef = useRef<{ row: MilestoneRow; index: number } | null>(null)
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current) }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [milestonesRes, notesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/milestones`),
          fetch(`/api/projects/${projectId}/notes`),
        ])
        const milestonesData: { milestones: Array<{ id: string; details: string | null; owner: string | null; projected_date: string | null; actualized_date: string | null; notes: string | null; status: string | null; tasks: MilestoneTask[] }>; project_notes: string } = await milestonesRes.json()
        const notesData: ProjectNote[] = await notesRes.json()
        setNotes(notesData)
        const milestones = milestonesData.milestones ?? []

        if (milestones.length === 0 && projectTemplate) {
          const tmpl = (templates ?? []).find(t => t.name === projectTemplate)
          if (tmpl && tmpl.items.length > 0) {
            const preFilled = tmpl.items
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(item => ({
                details: item.details ?? '',
                owner: '',
                owner_email: '',
                projected_date: '',
                actualized_date: '',
                notes: item.notes ?? '',
                status: 'Active',
                tasks: (item.tasks ?? []).map(t => ({ task: t.task })),
              }))
            setRows(preFilled)
            setExpandedIndices(new Set(preFilled.map((_, i) => i)))
            setEditingTasks(Object.fromEntries(
              preFilled.map((row, i) => [i, row.tasks.length > 0 ? row.tasks.map((t: MilestoneTask) => ({ ...t })) : [{ task: '' }]])
            ))
            try {
              const res = await fetch(`/api/projects/${projectId}/milestones`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ milestones: preFilled.map((r, i) => ({ ...r, sort_order: i })), deleted_ids: [] }),
              })
              if (res.ok) {
                const saved = await res.json()
                const savedMilestones = saved.milestones ?? []
                for (let i = 0; i < savedMilestones.length; i++) {
                  const m = savedMilestones[i]
                  const templateTasks = preFilled[i]?.tasks ?? []
                  if (m.id && templateTasks.length > 0) {
                    await fetch(`/api/projects/${projectId}/milestone-tasks`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ milestone_id: m.id, tasks: templateTasks }),
                    })
                  }
                }
                const reloadRes = await fetch(`/api/projects/${projectId}/milestones`)
                const reloaded = await reloadRes.json()
                const reloadedRows = (reloaded.milestones ?? []).map((m: typeof milestones[0]) => ({
                  id: m.id, details: m.details ?? '', owner: m.owner ?? '',
                  owner_email: MANAGERS.find(mg => mg.name === (m.owner ?? ''))?.email ?? '',
                  projected_date: m.projected_date ?? '', actualized_date: m.actualized_date ?? '',
                  notes: m.notes ?? '', status: m.status ?? 'Active', tasks: m.tasks ?? [],
                }))
                setRows(reloadedRows)
                setExpandedIndices(new Set(reloadedRows.map((_: unknown, i: number) => i)))
                setEditingTasks(Object.fromEntries(
                  reloadedRows.map((row: MilestoneRow, i: number) => [i, row.tasks.length > 0 ? row.tasks.map((t: MilestoneTask) => ({ ...t })) : [{ task: '' }]])
                ))
              }
            } catch {}
            return
          }
        }

        const loadedRows = milestones.map(m => ({
          id: m.id,
          details: m.details ?? '',
          owner: m.owner ?? '',
          owner_email: MANAGERS.find(mg => mg.name === (m.owner ?? ''))?.email ?? '',
          projected_date: m.projected_date ?? '',
          actualized_date: m.actualized_date ?? '',
          notes: m.notes ?? '',
          status: m.status ?? 'Active',
          tasks: m.tasks ?? [],
        }))
        setRows(loadedRows)
        setExpandedIndices(new Set(loadedRows.map((_, i) => i)))
        setEditingTasks(Object.fromEntries(
          loadedRows.map((row, i) => [i, row.tasks.length > 0 ? row.tasks.map(t => ({ ...t })) : [{ task: '' }]])
        ))
      } catch {
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  function addRow() {
    const newIndex = rows.length
    setRows(r => [...r, { details: '', owner: '', owner_email: '', projected_date: '', actualized_date: '', notes: '', status: 'Active', tasks: [] }])
    setExpandedIndices(prev => new Set([...prev, newIndex]))
    setEditingTasks(prev => ({ ...prev, [newIndex]: [{ task: '' }] }))
  }

  function updateRow(index: number, field: keyof MilestoneRow, value: string) {
    setRows(r => r.map((row, i) => {
      if (i !== index) return row
      const updated = { ...row, [field]: value }
      if (field === 'owner') updated.owner_email = MANAGERS.find(m => m.name === value)?.email ?? ''
      return updated
    }))
  }

  function deleteRow(index: number) {
    const row = rows[index]
    setExpandedIndices(prev => {
      const next = new Set<number>()
      prev.forEach(i => { if (i < index) next.add(i); else if (i > index) next.add(i - 1) })
      return next
    })
    setEditingTasks(prev => {
      const next: Record<number, MilestoneTask[]> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k)
        if (i < index) next[i] = v
        else if (i > index) next[i - 1] = v
      })
      return next
    })
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

  function toggleExpand(index: number) {
    if (expandedIndices.has(index)) {
      setExpandedIndices(prev => { const next = new Set(prev); next.delete(index); return next })
      setEditingTasks(prev => { const next = { ...prev }; delete next[index]; return next })
    } else {
      setExpandedIndices(prev => new Set([...prev, index]))
      const row = rows[index]
      setEditingTasks(prev => ({ ...prev, [index]: row.tasks.length > 0 ? row.tasks.map(t => ({ ...t })) : [{ task: '' }] }))
    }
  }

  async function saveExpandedTasks(rowIndex: number) {
    const row = rows[rowIndex]
    if (!row.id) {
      alert('Please save the milestone first before adding tasks.')
      return
    }
    const tasks = editingTasks[rowIndex] ?? []
    setSavingTasks(prev => new Set([...prev, rowIndex]))
    try {
      const res = await fetch(`/api/projects/${projectId}/milestone-tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone_id: row.id, tasks: tasks.filter(t => t.task.trim()) }),
      })
      if (!res.ok) throw new Error()
      const { tasks: savedTasks } = await res.json()
      setRows(r => r.map((r2, i) => i === rowIndex ? { ...r2, tasks: savedTasks ?? [] } : r2))
      setEditingTasks(prev => ({ ...prev, [rowIndex]: savedTasks ?? [] }))
    } catch {
      alert('Failed to save tasks. Please try again.')
    } finally {
      setSavingTasks(prev => { const next = new Set(prev); next.delete(rowIndex); return next })
    }
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
        }),
      })
      if (!res.ok) throw new Error()
      const { milestones: saved } = await res.json()
      setRows(saved.map((m: MilestoneRow & { tasks: MilestoneTask[] }) => ({
        id: m.id, details: m.details ?? '', owner: m.owner ?? '',
        owner_email: MANAGERS.find(mg => mg.name === (m.owner ?? ''))?.email ?? '',
        projected_date: m.projected_date ?? '', actualized_date: m.actualized_date ?? '',
        notes: m.notes ?? '', status: m.status ?? 'Active', tasks: m.tasks ?? [],
      })))
      setDeletedIds([])
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  async function saveNote() {
    if (!newNoteText.trim()) return
    setSavingNote(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNoteText }),
      })
      if (!res.ok) throw new Error()
      const newNote: ProjectNote = await res.json()
      setNotes(n => [newNote, ...n])
      setNewNoteText('')
      setShowAddNote(false)
    } catch {
      alert('Failed to save note. Please try again.')
    } finally {
      setSavingNote(false)
    }
  }

  async function deleteNote(noteId: string) {
    setDeletingNote(noteId)
    try {
      const res = await fetch(`/api/projects/${projectId}/notes/${noteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setNotes(n => n.filter(x => x.id !== noteId))
    } catch {
      alert('Failed to delete note. Please try again.')
    } finally {
      setDeletingNote(null)
    }
  }

  function startEdit(note: ProjectNote) {
    setEditingNoteId(note.id)
    setEditNoteText(note.text)
  }

  function cancelEdit() {
    setEditingNoteId(null)
    setEditNoteText('')
  }

  async function saveEdit(noteId: string) {
    if (!editNoteText.trim()) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editNoteText }),
      })
      if (!res.ok) throw new Error()
      const updated: ProjectNote = await res.json()
      setNotes(n => n.map(x => x.id === noteId ? updated : x))
      cancelEdit()
    } catch {
      alert('Failed to save changes. Please try again.')
    } finally {
      setSavingEdit(false)
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
          items: rows.map(r => ({
            details: r.details,
            notes: r.notes,
            tasks: r.tasks.filter(t => t.task.trim()).map(t => ({ task: t.task })),
          })),
        }),
      })
      if (res.status === 409) { setTemplateSaveError('A template with that name already exists.'); return }
      if (!res.ok) { setTemplateSaveError('Failed to save template.'); return }
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
    <div className="flex gap-5 items-start">
      {/* Left: milestone table */}
      <div className="flex-1 min-w-0 space-y-3">
        {rows.length === 0 && <p className="text-[#94A3B8] text-sm">No milestones added yet.</p>}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'auto', minWidth: 680 }}>
              <colgroup>
                <col style={{ width: 24 }} />   {/* drag */}
                <col style={{ width: 28 }} />   {/* chevron */}
                <col />                          {/* details — grows */}
                <col style={{ width: 148 }} />  {/* owner */}
                <col style={{ width: 172 }} />  {/* owner email */}
                <col style={{ width: 120 }} />  {/* projected */}
                <col style={{ width: 120 }} />  {/* actual */}
                <col style={{ width: 130 }} />  {/* status */}
                <col />                          {/* milestone notes — grows */}
                <col style={{ width: 24 }} />   {/* delete */}
              </colgroup>
              <thead>
                <tr>
                  <th />
                  <th />
                  <th className="text-left pb-2 pr-2 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Milestone Details</th>
                  <th className="text-left pb-2 pr-2 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Owner</th>
                  <th className="text-left pb-2 pr-2 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Owner Email</th>
                  <th className="text-left pb-2 pr-2 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Projected</th>
                  <th className="text-left pb-2 pr-2 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Actual</th>
                  <th className="text-left pb-2 pr-2 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Status</th>
                  <th className="text-left pb-2 pr-2 text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Notes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <Fragment key={i}>
                    <tr
                      draggable
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={e => {
                        e.preventDefault()
                        if (dragIndex !== null && dragIndex !== i) {
                          const next = [...rows]
                          const [dragged] = next.splice(dragIndex, 1)
                          next.splice(i, 0, dragged)
                          setRows(next)
                          setDragIndex(i)
                        }
                      }}
                      onDragEnd={() => setDragIndex(null)}
                    >
                      <td className="py-1 pr-1 align-middle">
                        <button type="button" className="cursor-grab text-[#94A3B8] hover:text-white" draggable={false}>
                          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                            <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
                            <circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/>
                            <circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
                          </svg>
                        </button>
                      </td>
                      <td className="py-1 pr-2 align-middle">
                        <button
                          type="button"
                          onClick={() => toggleExpand(i)}
                          aria-label={expandedIndices.has(i) ? 'Collapse tasks' : 'Expand tasks'}
                          className="text-[#94A3B8] hover:text-white transition-colors"
                        >
                          <svg
                            width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className={`transition-transform duration-150 ${expandedIndices.has(i) ? 'rotate-90' : ''}`}
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </td>
                      <td className="py-1 pr-2">
                        <input value={row.details} onChange={e => updateRow(i, 'details', e.target.value)} className={cellInput} placeholder="Milestone details" />
                      </td>
                      <td className="py-1 pr-2">
                        <select value={row.owner} onChange={e => updateRow(i, 'owner', e.target.value)} className={cellInput}>
                          <option value="">— Select —</option>
                          {MANAGERS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                        </select>
                      </td>
                      <td className="py-1 pr-2">
                        <input value={row.owner_email} readOnly className={cellReadonly} placeholder="Auto-filled" />
                      </td>
                      <td className="py-1 pr-2">
                        <input type="date" value={row.projected_date} onChange={e => updateRow(i, 'projected_date', e.target.value)} className={cellInput} style={getProjectedDateStyle(row.projected_date, row.actualized_date)} />
                      </td>
                      <td className="py-1 pr-2">
                        <input type="date" value={row.actualized_date} onChange={e => updateRow(i, 'actualized_date', e.target.value)} className={cellInput} />
                      </td>
                      <td className="py-1 pr-2">
                        <select value={row.status} onChange={e => updateRow(i, 'status', e.target.value)} className={cellInput}>
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td className="py-1 pr-2">
                        <button
                          type="button"
                          onClick={() => { setNotesModal({ kind: 'milestone', rowIndex: i }); setNotesModalText(row.notes) }}
                          className={`${cellInput} text-left truncate ${row.notes ? 'text-white' : 'text-[#8899AA]'}`}
                        >
                          {row.notes || 'Notes...'}
                        </button>
                      </td>
                      <td className="py-1 align-middle">
                        <button type="button" onClick={() => deleteRow(i)} aria-label="Delete milestone" className="text-[#94A3B8] hover:text-[#C8102E] transition-colors">
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>

                    {/* Inline task editor */}
                    {expandedIndices.has(i) && (
                      <tr>
                        <td colSpan={10} className="pb-3 pt-0">
                          <div className="ml-6 mr-1 bg-[#0B1929] border border-[#1E3A5F] rounded-lg p-4">
                            <p className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium mb-3">
                              Tasks — {row.details || '(untitled milestone)'}
                            </p>
                            {(() => {
                              const taskList = editingTasks[i] ?? []
                              return (
                                <>
                                  {taskList.length > 0 && (
                                    <div className="grid text-[#94A3B8] text-xs uppercase tracking-wider mb-1 gap-2" style={{ gridTemplateColumns: '20px 1fr 120px 120px 110px 64px 28px' }}>
                                      <span />
                                      <span>Task</span>
                                      <span>Projected</span>
                                      <span>Actual</span>
                                      <span>Status</span>
                                      <span>Notes</span>
                                      <span />
                                    </div>
                                  )}
                                  {taskList.length === 0 && (
                                    <p className="text-[#94A3B8] text-xs italic mb-2">No tasks added yet.</p>
                                  )}
                                  <div className="space-y-2">
                                    {taskList.map((t, ti) => (
                                      <div key={ti} className="grid gap-2 items-center" style={{ gridTemplateColumns: '20px 1fr 120px 120px 110px 64px 28px' }}>
                                        <span className="text-[#94A3B8] text-xs text-right">{ti + 1}.</span>
                                        <input
                                          value={t.task}
                                          onChange={e => setEditingTasks(prev => ({ ...prev, [i]: (prev[i] ?? []).map((x, xi) => xi === ti ? { ...x, task: e.target.value } : x) }))}
                                          className={modalInput}
                                          placeholder="Specify task..."
                                        />
                                        <input
                                          type="date"
                                          value={t.projected_date ?? ''}
                                          onChange={e => setEditingTasks(prev => ({ ...prev, [i]: (prev[i] ?? []).map((x, xi) => xi === ti ? { ...x, projected_date: e.target.value } : x) }))}
                                          className={modalInput}
                                          style={getProjectedDateStyle(t.projected_date ?? '', t.actual_date ?? '')}
                                        />
                                        <input
                                          type="date"
                                          value={t.actual_date ?? ''}
                                          onChange={e => setEditingTasks(prev => ({ ...prev, [i]: (prev[i] ?? []).map((x, xi) => xi === ti ? { ...x, actual_date: e.target.value } : x) }))}
                                          className={modalInput}
                                        />
                                        <select
                                          value={t.status ?? 'Active'}
                                          onChange={e => setEditingTasks(prev => ({ ...prev, [i]: (prev[i] ?? []).map((x, xi) => xi === ti ? { ...x, status: e.target.value } : x) }))}
                                          className={modalInput}
                                        >
                                          <option value="Active">Active</option>
                                          <option value="Completed">Completed</option>
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() => { setNotesModal({ kind: 'task', rowIndex: i, taskIndex: ti }); setNotesModalText(t.notes ?? '') }}
                                          className={`text-xs px-2 py-1.5 border rounded transition-colors whitespace-nowrap ${t.notes ? 'border-[#C8102E] text-white' : 'border-[#1E3A5F] text-[#94A3B8] hover:text-white'}`}
                                        >
                                          {t.notes ? 'View' : 'Note'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingTasks(prev => ({ ...prev, [i]: (prev[i] ?? []).filter((_, xi) => xi !== ti) }))}
                                          className="text-[#94A3B8] hover:text-[#C8102E] transition-colors"
                                        >
                                          <TrashIcon />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex items-center justify-between mt-3">
                                    <button
                                      type="button"
                                      onClick={() => setEditingTasks(prev => ({ ...prev, [i]: [...(prev[i] ?? []), { task: '', projected_date: '', actual_date: '', status: 'Active', notes: '' }] }))}
                                      className="text-[#94A3B8] hover:text-white text-xs transition-colors"
                                    >
                                      + Add Task
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => saveExpandedTasks(i)}
                                      disabled={savingTasks.has(i)}
                                      className="bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-1.5 rounded-md transition-colors"
                                    >
                                      {savingTasks.has(i) ? 'Saving...' : 'Save Tasks'}
                                    </button>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showUndo && (
          <div className="flex items-center justify-between bg-[#1E3A5F] rounded-lg px-4 py-2 text-sm">
            <span className="text-[#94A3B8]">Milestone deleted.</span>
            <button type="button" onClick={undoDelete} className="text-[#C8102E] hover:text-white font-medium ml-4 transition-colors">Undo</button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={addRow} className="text-[#94A3B8] hover:text-white text-sm font-medium transition-colors">+ Add Milestone</button>
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
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Project Notes — fixed height, own scrollbar */}
      <div className="w-80 shrink-0">
        <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl flex flex-col" style={{ height: 500 }}>
          <div className="flex items-center justify-between px-3 py-3 border-b border-[#1E3A5F] shrink-0">
            <span className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Project Notes</span>
            <button
              type="button"
              onClick={() => { setNewNoteText(''); setShowAddNote(true) }}
              className="text-xs bg-[#1E3A5F] hover:bg-[#334E6A] text-[#94A3B8] hover:text-white px-2 py-1 rounded transition-colors font-medium shrink-0"
            >
              + Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {notes.length === 0 && <p className="text-[#94A3B8] text-xs italic p-3">No notes yet.</p>}
            {notes.map((note, idx) => {
              const isOwner = !!session?.user?.email && note.author_email === session.user.email
              const authorLabel = note.author_name ?? note.author_email?.split('@')[0] ?? null
              return (
                <div key={note.id}>
                  {idx > 0 && <div className="border-t border-[#1E3A5F]" />}
                  <div className="p-3">
                    {editingNoteId === note.id ? (
                      <>
                        <textarea
                          value={editNoteText}
                          onChange={e => setEditNoteText(e.target.value)}
                          className={`${modalInput} resize-none`}
                          rows={4}
                          autoFocus
                        />
                        <div className="flex gap-3 mt-2">
                          <button type="button" onClick={cancelEdit} className="text-xs text-[#94A3B8] hover:text-white transition-colors">
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(note.id)}
                            disabled={savingEdit || !editNoteText.trim()}
                            className="text-xs text-[#C8102E] hover:text-[#A50E25] font-medium transition-colors disabled:opacity-40"
                          >
                            {savingEdit ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-white text-sm whitespace-pre-wrap break-words leading-relaxed">{note.text}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[#94A3B8] text-xs">
                        {authorLabel && <span>{authorLabel} · </span>}
                        {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {isOwner && editingNoteId !== note.id && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(note)}
                            aria-label="Edit note"
                            className="text-[#94A3B8] hover:text-white transition-colors"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            disabled={deletingNote === note.id}
                            aria-label="Delete note"
                            className="text-[#94A3B8] hover:text-[#C8102E] disabled:opacity-40 transition-colors"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add Note modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-white font-semibold mb-4">Add Note</h3>
            <textarea
              value={newNoteText}
              onChange={e => setNewNoteText(e.target.value)}
              placeholder="Write your note..."
              autoFocus
              className={`${modalInput} resize-none`}
              rows={6}
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowAddNote(false)}
                className="flex-1 border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white rounded-lg py-2.5 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveNote}
                disabled={savingNote || !newNoteText.trim()}
                className="flex-1 bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes popup modal (milestone or task) */}
      {notesModal !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Notes">
          <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl space-y-4">
            <h3 className="text-white font-semibold">
              {notesModal.kind === 'milestone' ? 'Milestone Notes' : 'Task Notes'}
            </h3>
            <textarea
              value={notesModalText}
              onChange={e => setNotesModalText(e.target.value)}
              placeholder="Write your note..."
              autoFocus
              className={`${modalInput} resize-none`}
              rows={6}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setNotesModal(null); setNotesModalText('') }}
                className="flex-1 border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white rounded-lg py-2.5 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (notesModal.kind === 'milestone') {
                    updateRow(notesModal.rowIndex, 'notes', notesModalText)
                  } else {
                    const { rowIndex, taskIndex } = notesModal
                    setEditingTasks(prev => ({
                      ...prev,
                      [rowIndex]: (prev[rowIndex] ?? []).map((t, ti) => ti === taskIndex ? { ...t, notes: notesModalText } : t)
                    }))
                  }
                  setNotesModal(null)
                  setNotesModalText('')
                }}
                className="flex-1 bg-[#C8102E] hover:bg-[#A50E25] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save As Template modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-white font-semibold mb-4">Save As Template</h3>
            <input
              type="text"
              value={templateName}
              onChange={e => { setTemplateName(e.target.value); setTemplateSaveError('') }}
              placeholder="Template name..."
              className={modalInput}
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
    </div>
  )
}
