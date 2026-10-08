import { createSupabaseClient } from './supabase'

export async function canEditProject(projectId: string, userEmail: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const [{ data: project }, { data: editor }] = await Promise.all([
    supabase.from('projects').select('created_by').eq('id', projectId).maybeSingle(),
    supabase.from('project_editors').select('id').eq('project_id', projectId).ilike('email', userEmail).maybeSingle(),
  ])
  if (!project) return false
  if (project.created_by?.toLowerCase() === userEmail.toLowerCase()) return true
  return !!editor
}

export async function isProjectCreator(projectId: string, userEmail: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const { data: project } = await supabase
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .maybeSingle()
  return project?.created_by?.toLowerCase() === userEmail.toLowerCase()
}
