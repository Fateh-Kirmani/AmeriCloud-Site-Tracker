'use client'
import { useState, useEffect } from 'react'
import SearchableCombobox, { ComboboxOption } from '@/components/SearchableCombobox'

type Editor = { id: string; email: string; name: string | null }

async function fetchGraphUsers(q: string): Promise<ComboboxOption[]> {
  const res = await fetch(`/api/graph/users?q=${encodeURIComponent(q)}`)
  if (!res.ok) return []
  const data: { displayName: string; mail?: string; userPrincipalName: string }[] = await res.json()
  return data.map(u => ({
    label: u.displayName,
    value: u.displayName,
    secondary: u.mail ?? u.userPrincipalName,
  }))
}

const inputClass = 'w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors'

export default function ManageAccessModal({
  projectId,
  projectName,
  onClose,
}: {
  projectId: string
  projectName: string
  onClose: () => void
}) {
  const [editors, setEditors] = useState<Editor[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/projects/${projectId}/editors`)
      .then(r => r.ok ? r.json() : [])
      .then(setEditors)
      .finally(() => setLoading(false))
  }, [projectId])

  async function addEditor() {
    if (!newEmail) return
    setAdding(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/editors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName || null }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Failed to add editor.')
        return
      }
      const editor: Editor = await res.json()
      setEditors(prev => [...prev, editor])
      setNewName('')
      setNewEmail('')
    } finally {
      setAdding(false)
    }
  }

  async function removeEditor(editorId: string) {
    setRemovingId(editorId)
    try {
      const res = await fetch(`/api/projects/${projectId}/editors/${editorId}`, { method: 'DELETE' })
      if (res.ok) setEditors(prev => prev.filter(e => e.id !== editorId))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Manage Access</h3>
            <p className="text-[#94A3B8] text-xs mt-0.5 truncate max-w-[300px]">{projectName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#94A3B8] hover:text-white transition-colors shrink-0 ml-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Grant Editor Access</p>
          <SearchableCombobox
            value={newName}
            onSelect={(name, email) => { setNewName(name); setNewEmail(email ?? '') }}
            fetchOptions={fetchGraphUsers}
            placeholder="Search AmeriCloud staff..."
            inputClassName={inputClass}
          />
          {newEmail && <p className="text-[#94A3B8] text-xs pl-1">{newEmail}</p>}
          {error && <p className="text-[#F87171] text-xs pl-1">{error}</p>}
          <button
            type="button"
            onClick={addEditor}
            disabled={!newEmail || adding}
            className="w-full bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {adding ? 'Adding...' : 'Grant Access'}
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium">Editors</p>
          {loading ? (
            <p className="text-[#94A3B8] text-sm">Loading...</p>
          ) : editors.length === 0 ? (
            <p className="text-[#94A3B8] text-sm italic">No editors assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {editors.map(e => (
                <div key={e.id} className="flex items-center justify-between bg-[#0B1929] border border-[#1E3A5F] rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{e.name ?? e.email.split('@')[0]}</p>
                    <p className="text-[#94A3B8] text-xs truncate">{e.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEditor(e.id)}
                    disabled={removingId === e.id}
                    aria-label={`Remove ${e.name ?? e.email}`}
                    className="text-[#94A3B8] hover:text-[#C8102E] transition-colors disabled:opacity-40 shrink-0 ml-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
