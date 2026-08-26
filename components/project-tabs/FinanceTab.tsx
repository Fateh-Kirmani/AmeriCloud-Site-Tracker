'use client'
import { useState, useEffect } from 'react'
import { FinanceFile } from '@/types/milestone'
import TrashIcon from '@/components/icons/TrashIcon'

// Change this password to whatever you prefer
const FINANCE_PASSWORD = process.env.NEXT_PUBLIC_FINANCE_PASSWORD ?? 'Finance@APT'

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

export default function FinanceTab({ projectId }: { projectId: string }) {
  const [locked, setLocked] = useState(true)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  const [files, setFiles] = useState<FinanceFile[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  // Per-file notes editing: map of fileId -> draft notes text
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  // Which fileId is currently saving notes
  const [savingNotes, setSavingNotes] = useState<string | null>(null)

  function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwordInput === FINANCE_PASSWORD) {
      setLocked(false)
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  useEffect(() => {
    if (locked) return
    setLoading(true)
    fetch(`/api/projects/${projectId}/finance-files`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: FinanceFile[]) => {
        setFiles(data)
        const drafts: Record<string, string> = {}
        data.forEach(f => { drafts[f.id] = f.notes ?? '' })
        setNoteDrafts(drafts)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [locked, projectId])

  function closeModal() {
    setShowModal(false)
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
      setFiles((f) => [newFile, ...f.filter((x) => x.file_name !== newFile.file_name)])
      setNoteDrafts(d => ({ ...d, [newFile.id]: newFile.notes ?? '' }))
      closeModal()
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
    } catch {
      // silent fail
    }
  }

  async function handleDelete(fileId: string) {
    setDeleteError(false)
    try {
      const res = await fetch(`/api/projects/${projectId}/finance-files/${fileId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setFiles((f) => f.filter((x) => x.id !== fileId))
      setNoteDrafts(d => { const next = { ...d }; delete next[fileId]; return next })
    } catch {
      setDeleteError(true)
    }
  }

  async function saveNotes(fileId: string) {
    setSavingNotes(fileId)
    try {
      const res = await fetch(`/api/projects/${projectId}/finance-files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteDrafts[fileId] ?? '' }),
      })
      if (!res.ok) throw new Error()
      setFiles(f => f.map(x => x.id === fileId ? { ...x, notes: noteDrafts[fileId] || null } : x))
    } catch {
      // silent fail — user can retry
    } finally {
      setSavingNotes(null)
    }
  }

  function notesChanged(fileId: string): boolean {
    const file = files.find(f => f.id === fileId)
    return (noteDrafts[fileId] ?? '') !== (file?.notes ?? '')
  }

  if (locked) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <LockIcon />
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Finance — Restricted Access</p>
          <p className="text-[#94A3B8] text-sm mt-1">Enter the password to access finance files.</p>
        </div>
        <form onSubmit={submitPassword} className="w-full max-w-sm space-y-3">
          <input
            type="password"
            value={passwordInput}
            onChange={e => { setPasswordInput(e.target.value); setPasswordError(false) }}
            placeholder="Password"
            autoFocus
            className={inputClass + (passwordError ? ' border-[#F87171] focus:ring-[#F87171]' : '')}
          />
          {passwordError && <p className="text-[#F87171] text-xs">Incorrect password. Try again.</p>}
          <button
            type="submit"
            className="w-full bg-[#C8102E] hover:bg-[#A50E25] text-white font-semibold py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest"
          >
            Unlock
          </button>
        </form>
      </div>
    )
  }

  if (loading) return <p className="text-[#94A3B8] text-sm">Loading...</p>
  if (fetchError) return <p className="text-[#F87171] text-sm">Failed to load files. Please refresh.</p>

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <p className="text-[#94A3B8] text-sm">No finance files uploaded yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#94A3B8] text-xs uppercase tracking-wider text-left border-b border-[#1E3A5F]">
              <th className="pb-2 font-medium pr-4">Name</th>
              <th className="pb-2 font-medium pr-4">Type</th>
              <th className="pb-2 font-medium pr-4">Uploaded</th>
              <th className="pb-2 font-medium pr-4">Notes</th>
              <th className="pb-2" />
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E3A5F]">
            {files.map((f) => (
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
                <td className="py-3 pr-4 w-72">
                  <textarea
                    value={noteDrafts[f.id] ?? ''}
                    onChange={e => setNoteDrafts(d => ({ ...d, [f.id]: e.target.value }))}
                    placeholder="Add notes..."
                    rows={2}
                    className="w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-2 py-1.5 text-white text-xs placeholder-[#8899AA] focus:outline-none focus:ring-1 focus:ring-[#C8102E] focus:border-transparent transition-colors resize-none"
                  />
                  {notesChanged(f.id) && (
                    <button
                      type="button"
                      onClick={() => saveNotes(f.id)}
                      disabled={savingNotes === f.id}
                      className="mt-1 text-xs text-[#94A3B8] hover:text-white disabled:opacity-40 transition-colors font-medium"
                    >
                      {savingNotes === f.id ? 'Saving...' : 'Save notes'}
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
      <button type="button" onClick={() => setShowModal(true)} className="text-[#94A3B8] hover:text-white text-sm font-medium transition-colors">
        + Upload File
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Upload finance file">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} aria-hidden="true" />
          <div className="relative bg-[#112240] border border-[#1E3A5F] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-white font-semibold text-lg">Upload Finance File</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="finance-upload-file-input" className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium block mb-1.5">File</label>
                <input
                  id="finance-upload-file-input"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="text-[#94A3B8] text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:bg-[#1E3A5F] file:text-white file:text-sm file:cursor-pointer cursor-pointer w-full"
                />
              </div>
              <div>
                <label className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium block mb-1.5">Type</label>
                <input value={fileType} onChange={(e) => setFileType(e.target.value)} className={inputClass} placeholder="e.g. Invoice, Contract, Budget" />
              </div>
              {uploadError && <p className="text-[#F87171] text-xs">Upload failed. Please try again.</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="flex-1 border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white font-semibold py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest">
                Cancel
              </button>
              <button type="button" onClick={handleUpload} disabled={uploading || !uploadFile} className="flex-1 bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm uppercase tracking-widest">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
