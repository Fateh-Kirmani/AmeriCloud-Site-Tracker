import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import FilterPanel from '@/components/projects/FilterPanel'
import ProjectsTable from '@/components/projects/ProjectsTable'
import { Project } from '@/types/project'

const VALID_SORT_COLUMNS = ['site_name', 'americloud_site_id', 'status', 'client', 'created_at'] as const

type SearchParams = {
  search?: string
  project_code?: string
  client?: string
  template?: string
  pm?: string
  status?: string
  date?: string
  sort?: string
  dir?: string
  city?: string
  zip?: string
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const search = sp.search ?? ''
  const projectCode = sp.project_code ?? ''
  const client = sp.client ?? ''
  const template = sp.template ?? ''
  const pm = sp.pm ?? ''
  const status = sp.status ?? ''
  const date = sp.date ?? ''
  const city = sp.city ?? ''
  const zip = sp.zip ?? ''
  const sortParam = sp.sort ?? 'created_at'
  const dir = sp.dir === 'asc' ? 'asc' : 'desc'
  const sort = VALID_SORT_COLUMNS.includes(sortParam as typeof VALID_SORT_COLUMNS[number])
    ? sortParam
    : 'created_at'

  const hasActiveFilters = !!(search || projectCode || client || template || pm || status || date || city || zip)

  let filterTemplates: { id: string; name: string }[] = []
  let projects: Project[] = []
  let fetchError = false

  try {
    const supabase = createSupabaseClient()
    try {
      const { data: tmplData } = await supabase.from('milestone_templates').select('id, name').order('name')
      filterTemplates = tmplData ?? []
    } catch {}
    let query = supabase.from('projects').select('*')

    if (search) {
      query = query.or(
        `site_name.ilike.%${search}%,client.ilike.%${search}%,americloud_site_id.ilike.%${search}%,americloud_pm.ilike.%${search}%,city.ilike.%${search}%`
      )
    }
    if (projectCode) query = query.ilike('americloud_site_id', `%${projectCode}%`)
    if (client) query = query.eq('client', client)
    if (template) query = query.eq('project_template', template)
    if (pm) query = query.eq('americloud_pm', pm)
    if (status) query = query.eq('status', status)
    if (date) query = query.gte('created_at', date)
    if (city) query = query.ilike('city', `%${city}%`)
    if (zip) query = query.ilike('zip_code', `%${zip}%`)

    const { data, error } = await query.order(sort, { ascending: dir === 'asc' })

    if (error) {
      console.error('[HomePage] Supabase error:', error.message)
      fetchError = true
    } else {
      projects = (data as Project[]) ?? []
    }
  } catch (err) {
    console.error('[HomePage] Unexpected error fetching projects:', err)
    fetchError = true
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-[#94A3B8] mt-1">
            {fetchError ? '' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="bg-[#C8102E] hover:bg-[#A50E25] text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors shadow-lg"
        >
          + New Project
        </Link>
      </div>

      <FilterPanel
        initialSearch={search}
        initialProjectCode={projectCode}
        initialClient={client}
        initialTemplate={template}
        initialPm={pm}
        initialStatus={status}
        initialDate={date}
        initialCity={city}
        initialZip={zip}
        templates={filterTemplates}
      />

      {fetchError ? (
        <div className="bg-[#112240] border border-[#1E3A5F] rounded-xl p-12 text-center">
          <p className="text-[#94A3B8]">Failed to load projects. Please refresh.</p>
        </div>
      ) : (
        <ProjectsTable
          projects={projects}
          currentSort={sort}
          currentDir={dir}
          hasActiveFilters={hasActiveFilters}
        />
      )}
    </div>
  )
}
