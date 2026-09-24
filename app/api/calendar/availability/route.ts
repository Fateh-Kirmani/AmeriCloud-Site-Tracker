import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: 'date_from and date_to required' }, { status: 400 })
  }

  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('crew_members')
      .select('email, name, project_id')
      .not('date_from', 'is', null)
      .not('date_to', 'is', null)
      .not('email', 'is', null)
      .lte('date_from', dateTo)
      .gte('date_to', dateFrom)

    if (error) {
      console.error('[GET /api/calendar/availability]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const projectIds = [...new Set((data ?? []).map(c => c.project_id).filter(Boolean))]
    let projectMap: Record<string, string> = {}
    if (projectIds.length > 0) {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, site_name')
        .in('id', projectIds)
      projectMap = Object.fromEntries((projectsData ?? []).map(p => [p.id, p.site_name]))
    }

    const seen = new Set<string>()
    const result: { email: string; name: string; project_name: string }[] = []
    for (const row of data ?? []) {
      const key = (row.email ?? '').toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      result.push({
        email: key,
        name: row.name ?? '',
        project_name: projectMap[row.project_id] ?? 'Unknown',
      })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
