import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import FilterPanel from '@/components/projects/FilterPanel'
import ProjectsTable from '@/components/projects/ProjectsTable'
import { Project } from '@/types/project'

const VALID_SORT_COLUMNS = ['site_name', 'client', 'americloud_site_id', 'created_at'] as const

type SearchParams = {
  search?: string
  client?: string
  template?: string
  pm?: string
  from?: string
  to?: string
  sort?: string
  dir?: string
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const search = sp.search ?? ''
  const client = sp.client ?? ''
  const template = sp.template ?? ''
  const pm = sp.pm ?? ''
  const from = sp.from ?? ''
  const to = sp.to ?? ''
  const sortParam = sp.sort ?? 'created_at'
  const dir = sp.dir === 'asc' ? 'asc' : 'desc'
  const sort = VALID_SORT_COLUMNS.includes(sortParam as typeof VALID_SORT_COLUMNS[number])
    ? sortParam
    : 'created_at'

  const hasActiveFilters = !!(search || client || template || pm || from || to)

  let projects: Project[] = []
  let fetchError = false

  try {
    const supabase = createSupabaseClient()
    let query = supabase.from('projects').select('*')

    if (search) query = query.ilike('site_name', `%${search}%`)
    if (client) query = query.eq('client', client)
    if (template) query = query.eq('project_template', template)
    if (pm) query = query.eq('americloud_pm', pm)
    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

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
        initialClient={client}
        initialTemplate={template}
        initialPm={pm}
        initialFrom={from}
        initialTo={to}
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
