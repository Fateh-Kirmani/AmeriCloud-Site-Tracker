'use client'
import { useState, useEffect, useRef } from 'react'
import { FinanceFile } from '@/types/milestone'
import TrashIcon from '@/components/icons/TrashIcon'

type AccessEntry = { id: string; user_email: string; user_name: string | null; created_at: string }
type GraphUser = { displayName: string; mail: string | null; userPrincipalName: string }

const inputClass =
  'w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors'

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#94A3B8]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  )
}

export default function FinanceTab({ projectId }: { projectId: string }) {
  // Access control
  const [accessStatus, setAccessStatus] = useState<'loading' | 'denied' | 'granted'>('loading')
  const [isOwner, setIsOwner] = useState(false)
  const [accessList, setAccessList] = useState<AccessEntry[]>([])

  // File list
  const [files, setFiles] = useState<FinanceFile[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  // Per-file notes and status
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({})
  const [savingDrafts, setSavingDrafts] = useState<string | null>(null)

  // Manage Access modal
  const [showManageModal, setShowManageModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GraphUser[]>([])
  const [searching, setSearching] = useState(false)
  const [addingEmail, setAddingEmail] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [addError, setAddError] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check access on mount
  useEffect(() => {
    fetch(`/api/projects/${projectId}/finance-access`)
      .then(r => r.json())
      .then(data => {
        setIsOwner(data.isOwner ?? false)
        setAccessList(data.accessList ?? [])
        setAccessStatus(data.hasAccess ? 'granted' : 'denied')
      })
      .catch(() => setAccessStatus('denied'))
  }, [projectId])

  // Load files once access is confirmed
  useEffect(() => {
    if (accessStatus !== 'granted') return
    setLoading(true)
    fetch(`/api/projects/${projectId}/finance-files`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: FinanceFile[]) => {
        setFiles(data)
        const notes: Record<string, string> = {}
        const statuses: Record<string, string> = {}
        data.forEach(f => { notes[f.id] = f.notes ?? ''; statuses[f.id] = f.status ?? '' })
        setNoteDrafts(notes)
        setStatusDrafts(statuses)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [accessStatus, projectId])

  // Debounced Graph user search
  useEffect(() => {
    if (!showManageModal) return
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (searchQuery.trim().length < 2) { setSearchResults([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/graph/users?q=${encodeURIComponent(searchQuery.trim())}`)
        if (res.ok) setSearchResults(await res.json())
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [searchQuery, showManageModal])

  function closeManageModal() {
    setShowManageModal(false)
    setSearchQuery('')
    setSearchResults([])
    setAddError('')
  }

  async function grantAccess(user: GraphUser) {
    const email = (user.mail ?? user.userPrincipalName).toLowerCase()
    if (accessList.some(a => a.user_email === email)) {
      setAddError(`${user.displayName} already has access.`)
      return
    }
    setAddingEmail(email)
    setAddError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/finance-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: email, user_name: user.displayName }),
      })
      if (!res.ok) {
        const err = await res.json()
        setAddError(err.error === 'User already has access' ? `${user.displayName} already has access.` : 'Failed to grant access.')
        return
      }
      const entry: AccessEntry = await res.json()
      setAccessList(prev => [...prev, entry])
      setSearchQuery('')
      setSearchResults([])
    } catch {
      setAddError('Failed to grant access. Please try again.')
    } finally {
      setAddingEmail(null)
    }
  }

  async function revokeAccess(accessId: string) {
    setRemovingId(accessId)
    try {
      const res = await fetch(`/api/projects/${projectId}/finance-access/${accessId}`, { method: 'DELETE' })
      if (res.ok) setAccessList(prev => prev.filter(a => a.id !== accessId))
    } finally {
      setRemovingId(null)
    }
  }

  function closeUploadModal() {
    setShowUploadModal(false)
    setUploadFile(null)
    setFileType('')
    setUploadError(false)
  }

  async function handleUpload() {
    if (!uploadFile) return
    setUploading(true)
    setUploadError(false)
    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('file_type', fileType)
    try {
      const res = await fetch(`/api/projects/${projectId}/finance-files`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const newFile: FinanceFile = await res.json()
      setFiles(f => [newFile, ...f.filter(x => x.file_name !== newFile.file_name)])
      setNoteDrafts(d => ({ ...d, [newFile.id]: newFile.notes ?? '' }))
      setStatusDrafts(d => ({ ...d, [newFile.id]: newFile.status ?? '' }))
      closeUploadModal()
    } catch {
      setUploadError(true)
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(url: string, fileName: string) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = fileName
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch { /* silent */ }
  }

  async function handleDelete(fileId: string) {
    setDeleteError(false)
    try {
      const res = await fetch(`/api/projects/${projectId}/finance-files/${fileId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setFiles(f => f.filter(x => x.id !== fileId))
      setNoteDrafts(d => { const n = { ...d }; delete n[fileId]; return n })
      setStatusDrafts(d => { const n = { ...d }; delete n[fileId]; return n })
    } catch {
      setDeleteError(true)
    }
  }

  async function saveDrafts(fileId: string) {
    setSavingDrafts(fileId)
    try {
      const res = await fetch(`/api/projects/${projectId}/finance-files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteDrafts[fileId] ?? '', status: statusDrafts[fileId] ?? '' }),
      })
      if (!res.ok) throw new Error()
      setFiles(f => f.map(x => x.id === fileId ? { ...x, notes: noteDrafts[fileId] || null, status: statusDrafts[fileId] || null } : x))
    } catch { /* silent — user can retry */ } finally {
      setSavingDrafts(null)
    }
  }

  function draftsChanged(fileId: string): boolean {
    const file = files.find(f => f.id === fileId)
    return (noteDrafts[fileId] ?? '') !== (file?.notes ?? '') ||
      (statusDrafts[fileId] ?? '') !== (file?.status ?? '')
  }

  // — Render —

  if (accessStatus === 'loading') {
    return <p className="text-[#94A3B8] text-sm">Checking access...</p>
  }

  if (accessStatus === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <LockIcon />
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Finance — Restricted Access</p>
          <p className="text-[#94A3B8] text-sm mt-1">You don&apos;t have permission to view this tab. Contact the project owner to request access.</p>
        </div>
      </div>
    )
  }

  if (loading) return <p className="text-[#94A3B8] text-sm">Loading...</p>
  if (fetchError) return <p className="text-[#F87171] text-sm">Failed to load files. Please refresh.</p>

  return (
    <div className="space-y-4">
      {/* Header row — only visible to owner */}
      {isOwner && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-white border border-[#1E3A5F] hover:border-white px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            <UsersIcon />
            Manage Access
            {accessList.length > 0 && (
              <span className="bg-[#1E3A5F] text-[#94A3B8] text-xs px-1.5 py-0.5 rounded-full">{accessList.length}</span>
            )}
          </button>
        </div>
      )}

      {/* File list */}
      {files.length === 0 ? (
        <p className="text-[#94A3B8] text-sm">No finance files uploaded yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#94A3B8] text-xs uppercase tracking-wider text-left border-b border-[#1E3A5F]">
              <th className="pb-2 font-medium pr-4">Name</th>
              <th className="pb-2 font-medium pr-4">Type</th>
              <th className="pb-2 font-medium pr-4">Uploaded</th>
              <th className="pb-2 font-medium pr-4">Status</th>
              <th className="pb-2 font-medium pr-4">Notes</th>
              <th className="pb-2" />
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E3A5F]">
            {files.map(f => (
              <tr key={f.id} className="align-top">
                <td className="py-3 pr-4">
                  <a href={f.url ?? '#'} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#C8102E] underline transition-colors">
                    {f.file_name}
                  </a>
                </td>
                <td className="py-3 pr-4 text-[#94A3B8]">{f.file_type ?? '—'}</td>
                <td className="py-3 pr-4 text-[#94A3B8] whitespace-nowrap">
                  {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="py-3 pr-4 w-40">
                  <input
                    value={statusDrafts[f.id] ?? ''}
                    onChange={e => setStatusDrafts(d => ({ ...d, [f.id]: e.target.value }))}
                    placeholder="Add status..."
                    className="w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-2 py-1.5 text-white text-xs placeholder-[#8899AA] focus:outline-none focus:ring-1 focus:ring-[#C8102E] focus:border-transparent transition-colors"
                  />
                </td>
                <td className="py-3 pr-4 w-64">
                  <textarea
                    value={noteDrafts[f.id] ?? ''}
                    onChange={e => setNoteDrafts(d => ({ ...d, [f.id]: e.target.value }))}
                    placeholder="Add notes..."
                    rows={2}
                    className="w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-2 py-1.5 text-white text-xs placeholder-[#8899AA] focus:outline-none focus:ring-1 focus:ring-[#C8102E] focus:border-transparent transition-colors resize-none"
                  />
                  {draftsChanged(f.id) && (
                    <button
                      type="button"
                      onClick={() => saveDrafts(f.id)}
                      disabled={savingDrafts === f.id}
                      className="mt-1 text-xs text-[#94A3B8] hover:text-white disabled:opacity-40 transition-colors font-medium"
                    >
                      {savingDrafts === f.id ? 'Saving...' : 'Save changes'}
                    </button>
                  )}
                </td>
                <td className="py-3 pr-2">
                  <button type="button" onClick={() => handleDownload(f.url ?? '#', f.file_name)} disabled={!f.url} aria-label="Download file" className="text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors mt-1">
                    <DownloadIcon />
                  </button>
                </td>
                <td className="py-3">
                  <button type="button" onClick={() => handleDelete(f.id)} aria-label="Delete file" className="text-[#94A3B8] hover:text-[#C8102E] transition-colors mt-1">
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteError && <p className="text-[#F87171] text-xs">Failed to delete file. Please try again.</p>}
      <button type="button" onClick={() => setShowUploadModal(true)} className="text-[#94A3B8] hover:text-white text-sm font-medium transition-colors">
        + Upload File
      </button>

      {/* Upload modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Upload finance file">
          <div className="absolute inset-0 bg-black/50" onClick={closeUploadModal} aria-hidden="true" />
          <div className="relative bg-[#112240] border border-[#1E3A5F] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-white font-semibold text-lg">Upload Finance File</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="finance-upload-file-input" className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium block mb-1.5">File</label>
                <input
                  id="finance-upload-file-input"
                  type="file"
                  onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                  className="text-[#94A3B8] text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:bg-[#1E3A5F] file:text-white file:text-sm file:cursor-pointer cursor-pointer w-full"
                />
              </div>
              <div>
                <label className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium block mb-1.5">Type</label>
                <input value={fileType} onChange={e => setFileType(e.target.value)} className={inputClass} placeholder="e.g. Invoice, Contract, Budget" />
              </div>
              {uploadError && <p className="text-[#F87171] text-xs">Upload failed. Please try again.</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeUploadModal} className="flex-1 border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white font-semibold py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest">Cancel</button>
              <button type="button" onClick={handleUpload} disabled={uploading || !uploadFile} className="flex-1 bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Access modal */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Manage Finance Access">
          <div className="absolute inset-0 bg-black/50" onClick={closeManageModal} aria-hidden="true" />
          <div className="relative bg-[#112240] border border-[#1E3A5F] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            <div>
              <h2 className="text-white font-semibold text-lg">Manage Finance Access</h2>
              <p className="text-[#94A3B8] text-xs mt-1">Search for people in your organisation to grant access to this Finance tab.</p>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setAddError('') }}
                placeholder="Search by name or email..."
                autoFocus
                className={inputClass}
              />
              {searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs">Searching...</span>
              )}
            </div>

            {addError && <p className="text-[#F87171] text-xs -mt-2">{addError}</p>}

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="border border-[#1E3A5F] rounded-lg divide-y divide-[#1E3A5F] max-h-48 overflow-y-auto">
                {searchResults.map(u => {
                  const email = (u.mail ?? u.userPrincipalName).toLowerCase()
                  const alreadyHas = accessList.some(a => a.user_email === email)
                  return (
                    <div key={email} className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <p className="text-white text-sm">{u.displayName}</p>
                        <p className="text-[#94A3B8] text-xs">{email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => grantAccess(u)}
                        disabled={alreadyHas || addingEmail === email}
                        className="text-xs font-medium px-3 py-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#C8102E] hover:bg-[#A50E25] text-white"
                      >
                        {alreadyHas ? 'Added' : addingEmail === email ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Current access list */}
            <div>
              <p className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium mb-2">
                People with access {accessList.length > 0 && `(${accessList.length})`}
              </p>
              {accessList.length === 0 ? (
                <p className="text-[#94A3B8] text-xs italic">No one has been granted access yet.</p>
              ) : (
                <div className="border border-[#1E3A5F] rounded-lg divide-y divide-[#1E3A5F] max-h-48 overflow-y-auto">
                  {accessList.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <p className="text-white text-sm">{entry.user_name ?? entry.user_email}</p>
                        {entry.user_name && <p className="text-[#94A3B8] text-xs">{entry.user_email}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => revokeAccess(entry.id)}
                        disabled={removingId === entry.id}
                        aria-label="Remove access"
                        className="text-[#94A3B8] hover:text-[#C8102E] disabled:opacity-40 transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={closeManageModal}
              className="w-full border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white font-semibold py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
