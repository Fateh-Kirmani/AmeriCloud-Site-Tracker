import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import EditProjectForm from '@/components/forms/EditProjectForm'
import ImportToBomButton from '@/components/forms/ImportToBomButton'
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

  let templates: { id: string; name: string }[] = []
  let fullTemplates: { name: string; items: { details: string | null; notes: string | null; sort_order: number }[] }[] = []
  try {
    const { data: tmplData } = await supabase
      .from('milestone_templates')
      .select('id, name, milestone_template_items(id, details, notes, sort_order)')
      .order('name')
    templates = (tmplData ?? []).map((t: any) => ({ id: t.id, name: t.name }))
    fullTemplates = (tmplData ?? []).map((t: any) => ({
      name: t.name,
      items: (t.milestone_template_items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }))
  } catch {}

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Project</h1>
          <p className="text-[#94A3B8] mt-1">{project.site_name}</p>
        </div>
        <ImportToBomButton
          client={project.client}
          project={project.site_name}
          street={project.street ?? ''}
          city={project.city ?? ''}
          state={project.state ?? ''}
          zipCode={project.zip_code ?? ''}
          projectOverview={project.project_scope ?? ''}
        />
      </div>
      <EditProjectForm project={project} templates={templates} fullTemplates={fullTemplates} />
    </div>
  )
}
