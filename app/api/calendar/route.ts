import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const month = parseInt(searchParams.get('month') ?? '0', 10)
  const year = parseInt(searchParams.get('year') ?? '0', 10)

  try {
    const supabase = createSupabaseClient()

    let query = supabase
      .from('crew_members')
      .select('id, name, email, task, location, date_from, date_to, project_id')
      .not('date_from', 'is', null)
      .not('date_to', 'is', null)

    if (email) {
      query = query.ilike('email', email)
    }

    if (month && year) {
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`
      const daysInMonth = new Date(year, month, 0).getDate()
      const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
      query = query.lte('date_from', endOfMonth).gte('date_to', startOfMonth)
    }

    const { data: crewData, error } = await query
    if (error) {
      console.error('[GET /api/calendar]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const projectIds = [...new Set((crewData ?? []).map(c => c.project_id).filter(Boolean))]
    let projectMap: Record<string, string> = {}
    if (projectIds.length > 0) {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, site_name')
        .in('id', projectIds)
      projectMap = Object.fromEntries((projectsData ?? []).map(p => [p.id, p.site_name]))
    }

    return NextResponse.json(
      (crewData ?? []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        task: c.task,
        location: c.location,
        date_from: c.date_from,
        date_to: c.date_to,
        project_id: c.project_id,
        project_name: projectMap[c.project_id] ?? 'Unknown',
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
