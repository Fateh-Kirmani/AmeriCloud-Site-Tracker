import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import EditProjectForm from '@/components/forms/EditProjectForm'
import { Project } from '@/types/project'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-12 text-center">
          <p className="text-[#94A3B8] text-lg mb-4">Project not found.</p>
          <Link href="/" className="text-[#C8102E] hover:underline text-sm">
            ← Back to projects
          </Link>
        </div>
      </div>
    )
  }

  const project = data as Project

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Edit Project</h1>
        <p className="text-[#94A3B8] mt-1">{project.site_name}</p>
      </div>
      <EditProjectForm project={project} />
    </div>
  )
}
