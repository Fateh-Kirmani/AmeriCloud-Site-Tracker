'use client'
import { useState, useEffect } from 'react'
import { ProjectFile } from '@/types/milestone'

const inputClass =
  'w-full bg-[#0B1929] border border-[#1E3A5F] rounded-md px-3 py-2 text-white text-sm placeholder-[#4A6FA5] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors'

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

export default function FilesTab({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/files`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setFiles)
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [projectId])

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
      const res = await fetch(`/api/projects/${projectId}/files`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const newFile: ProjectFile = await res.json()
      setFiles((f) => [newFile, ...f.filter((x) => x.file_name !== newFile.file_name)])
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
      // silent fail — file is still accessible via the name link
    }
  }

  async function handleDelete(fileId: string) {
    setDeleteError(false)
    try {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setFiles((f) => f.filter((x) => x.id !== fileId))
    } catch {
      setDeleteError(true)
    }
  }

  if (loading) return <p className="text-[#94A3B8] text-sm">Loading...</p>
  if (fetchError) return <p className="text-[#C8102E] text-sm">Failed to load files. Please refresh.</p>

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <p className="text-[#94A3B8] text-sm">No files uploaded yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#94A3B8] text-xs uppercase tracking-wider text-left border-b border-[#1E3A5F]">
              <th className="pb-2 font-medium pr-4">Name</th>
              <th className="pb-2 font-medium pr-4">Type</th>
              <th className="pb-2 font-medium pr-4">Uploaded</th>
              <th className="pb-2" />
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E3A5F]">
            {files.map((f) => (
              <tr key={f.id} className="hover:bg-[#0B1929]">
                <td className="py-3 pr-4">
                  <a href={f.url ?? '#'} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#C8102E] underline transition-colors">
                    {f.file_name}
                  </a>
                </td>
                <td className="py-3 pr-4 text-[#94A3B8]">{f.file_type ?? '—'}</td>
                <td className="py-3 pr-4 text-[#94A3B8]">
                  {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="py-3 pr-2">
                  <button type="button" onClick={() => handleDownload(f.url ?? '#', f.file_name)} disabled={!f.url} aria-label="Download file" className="text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <DownloadIcon />
                  </button>
                </td>
                <td className="py-3">
                  <button type="button" onClick={() => handleDelete(f.id)} aria-label="Delete file" className="text-[#94A3B8] hover:text-[#C8102E] transition-colors">
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteError && <p className="text-[#C8102E] text-xs">Failed to delete file. Please try again.</p>}
      <button type="button" onClick={() => setShowModal(true)} className="text-[#94A3B8] hover:text-white text-sm font-medium transition-colors">
        + Upload File
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Upload file">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} aria-hidden="true" />
          <div className="relative bg-[#112240] border border-[#1E3A5F] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-white font-semibold text-lg">Upload File</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="upload-file-input" className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium block mb-1.5">File</label>
                <input
                  id="upload-file-input"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="text-[#94A3B8] text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:bg-[#1E3A5F] file:text-white file:text-sm file:cursor-pointer cursor-pointer w-full"
                />
              </div>
              <div>
                <label className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium block mb-1.5">Type</label>
                <input value={fileType} onChange={(e) => setFileType(e.target.value)} className={inputClass} placeholder="e.g. Contract, Drawing, Report" />
              </div>
              {uploadError && <p className="text-[#C8102E] text-xs">Upload failed. Please try again.</p>}
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
