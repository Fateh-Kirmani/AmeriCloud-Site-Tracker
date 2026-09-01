'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Project } from '@/types/project'
import { ProjectNote } from '@/types/milestone'
import DeleteConfirmModal from '@/components/projects/DeleteConfirmModal'

type Props = {
  projects: Project[]
  currentSort: string
  currentDir: 'asc' | 'desc'
  hasActiveFilters?: boolean
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <span className="ml-1 text-[#1E3A5F]">↕</span>
  return <span className="ml-1 text-[#C8102E]">{dir === 'asc' ? '↑' : '↓'}</span>
}

const STATUS_STYLES: Record<string, string> = {
  'Active': 'bg-green-500/20 text-green-400 border border-green-500/30',
  'On Hold': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  'Completed': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'Cancelled': 'bg-[#1E3A5F] text-[#94A3B8] border border-[#334E6A]',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES['Active']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>
      {status ?? 'Active'}
    </span>
  )
}

export default function ProjectsTable({ projects, currentSort, currentDir, hasActiveFilters }: Props) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; siteName: string } | null>(null)
  const [notesProject, setNotesProject] = useState<{ id: string; site_name: string } | null>(null)
  const [notesList, setNotesList] = useState<ProjectNote[]>([])
  const [notesLoading, setNotesLoading] = useState(false)

  async function openNotes(project: Project) {
    setNotesProject({ id: project.id, site_name: project.site_name })
    setNotesList([])
    setNotesLoading(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/notes`)
      if (res.ok) setNotesList(await res.json())
    } finally {
      setNotesLoading(false)
    }
  }

  function handleSort(col: string) {
    const newDir = currentSort === col && currentDir === 'asc' ? 'desc' : 'asc'
    const params = new URLSearchParams(window.location.search)
    params.set('sort', col)
    params.set('dir', newDir)
    router.push(`/?${params.toString()}`)
  }

  if (projects.length === 0) {
    return (
      <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-16 text-center">
        {hasActiveFilters ? (
          <>
            <p className="text-[#94A3B8] text-lg mb-4">No projects match your filters.</p>
            <Link href="/" className="text-[#C8102E] hover:underline text-sm">
              Clear filters
            </Link>
          </>
        ) : (
          <>
            <p className="text-[#94A3B8] text-lg mb-4">No projects yet.</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1 text-[#C8102E] hover:underline text-sm"
            >
              Create your first project →
            </Link>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      {notesProject && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setNotesProject(null)}>
          <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{notesProject.site_name} — Notes</h3>
              <button type="button" onClick={() => setNotesProject(null)} className="text-[#94A3B8] hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {notesLoading ? (
                <p className="text-[#94A3B8] text-sm">Loading...</p>
              ) : notesList.length === 0 ? (
                <p className="text-[#94A3B8] text-sm italic">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {notesList.map(note => (
                    <div key={note.id} className="border border-[#1E3A5F] rounded-lg p-3">
                      <p className="text-white text-sm whitespace-pre-wrap">{note.text}</p>
                      <p className="text-[#94A3B8] text-xs mt-2">
                        {note.author_name ?? note.author_email ?? 'Unknown'} &middot;{' '}
                        {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          projectId={deleteTarget.id}
          siteName={deleteTarget.siteName}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => setDeleteTarget(null)}
        />
      )}
      <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl overflow-hidden">

        {/* Mobile cards — shown below sm */}
        <div className="block sm:hidden divide-y divide-[#1E3A5F]">
          {projects.map((project) => (
            <div key={project.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-white font-medium leading-snug">{project.site_name}</p>
                <StatusBadge status={project.status ?? 'Active'} />
              </div>
              <p className="text-[#94A3B8] text-sm">{project.client}</p>
              {project.americloud_site_id && (
                <p className="text-[#94A3B8] text-xs mt-1">{project.americloud_site_id}</p>
              )}
              {(project.city || project.zip_code) && (
                <p className="text-[#94A3B8] text-xs mt-0.5">{[project.city, project.zip_code].filter(Boolean).join(', ')}</p>
              )}
              <div className="flex gap-3 mt-1">
                {project.project_template && (
                  <p className="text-[#94A3B8] text-xs">{project.project_template}</p>
                )}
                {project.americloud_pm && (
                  <p className="text-[#94A3B8] text-xs">{project.americloud_pm}</p>
                )}
              </div>
              <p className="text-[#94A3B8] text-xs mt-0.5">
                {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <div className="flex gap-2 mt-3">
                <Link
                  href={`/projects/${project.id}/edit`}
                  aria-label={`Edit ${project.site_name}`}
                  className="flex-1 text-center border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white rounded-md py-1.5 text-xs font-medium transition-colors"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ id: project.id, siteName: project.site_name })}
                  aria-label={`Delete ${project.site_name}`}
                  className="flex-1 border border-[#1E3A5F] text-[#94A3B8] hover:text-[#C8102E] hover:border-[#C8102E] rounded-md py-1.5 text-xs font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table — shown sm and up */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0D1F35] border-b border-[#1E3A5F]">
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => handleSort('site_name')}
                    className="flex items-center text-[#94A3B8] uppercase text-xs tracking-wider font-medium hover:text-white transition-colors"
                    aria-label="Project Name"
                  >
                    Project Name
                    <SortIcon active={currentSort === 'site_name'} dir={currentDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-[#94A3B8] uppercase text-xs tracking-wider font-medium">
                  Project Code
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center text-[#94A3B8] uppercase text-xs tracking-wider font-medium hover:text-white transition-colors"
                    aria-label="Status"
                  >
                    Status
                    <SortIcon active={currentSort === 'status'} dir={currentDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => handleSort('client')}
                    className="flex items-center text-[#94A3B8] uppercase text-xs tracking-wider font-medium hover:text-white transition-colors"
                    aria-label="Client"
                  >
                    Client
                    <SortIcon active={currentSort === 'client'} dir={currentDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-[#94A3B8] uppercase text-xs tracking-wider font-medium">
                  City
                </th>
                <th className="text-left px-4 py-3 text-[#94A3B8] uppercase text-xs tracking-wider font-medium">
                  ZIP
                </th>
                <th className="text-left px-4 py-3 text-[#94A3B8] uppercase text-xs tracking-wider font-medium">
                  Template
                </th>
                <th className="text-left px-4 py-3 text-[#94A3B8] uppercase text-xs tracking-wider font-medium">
                  PM
                </th>
                <th className="text-left px-4 py-3 text-[#94A3B8] uppercase text-xs tracking-wider font-medium">
                  Notes
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center text-[#94A3B8] uppercase text-xs tracking-wider font-medium hover:text-white transition-colors"
                    aria-label="Date"
                  >
                    Date
                    <SortIcon active={currentSort === 'created_at'} dir={currentDir} />
                  </button>
                </th>
                <th className="px-4 py-3 text-[#94A3B8] uppercase text-xs tracking-wider font-medium text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, i) => (
                <tr
                  key={project.id}
                  className={`border-b border-[#1E3A5F] hover:bg-[#1E3A5F] transition-colors ${
                    i === projects.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-white font-medium">{project.site_name}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{project.americloud_site_id ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={project.status ?? 'Active'} /></td>
                  <td className="px-4 py-3 text-[#94A3B8]">{project.client}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{project.city ?? '—'}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{project.zip_code ?? '—'}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{project.project_template ?? '—'}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{project.americloud_pm ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openNotes(project)}
                      className="text-[#94A3B8] hover:text-white transition-colors"
                      title="View notes"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[#94A3B8]">
                    {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/projects/${project.id}/edit`}
                        aria-label={`Edit ${project.site_name}`}
                        className="text-[#94A3B8] hover:text-white transition-colors p-1.5 rounded hover:bg-[#112240]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => setDeleteTarget({ id: project.id, siteName: project.site_name })}
                        aria-label={`Delete ${project.site_name}`}
                        className="text-[#94A3B8] hover:text-[#C8102E] transition-colors p-1.5 rounded hover:bg-[#112240]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  )
}
