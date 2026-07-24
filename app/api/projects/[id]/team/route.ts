import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createSupabaseClient()
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const [teamResult, milestonesResult] = await Promise.all([
      supabase.from('team_members').select('*').eq('project_id', id).order('created_at', { ascending: true }),
      supabase.from('milestones').select('id, details').eq('project_id', id).order('created_at', { ascending: true }),
    ])

    if (teamResult.error) {
      console.error('[GET /api/projects/[id]/team]', teamResult.error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      team_members: teamResult.data,
      milestones: milestonesResult.data ?? [],
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { team_members, deleted_ids } = body as { team_members: unknown; deleted_ids: unknown }
  if (!Array.isArray(team_members) || !Array.isArray(deleted_ids)) {
    return NextResponse.json({ error: 'Invalid body shape' }, { status: 400 })
  }

  try {
    const supabase = createSupabaseClient()
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    if (deleted_ids.length > 0) {
      const { error } = await supabase.from('team_members').delete().in('id', deleted_ids)
      if (error) {
        console.error('[PUT /api/projects/[id]/team] delete error:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    if (team_members.length > 0) {
      const rows = (team_members as Record<string, unknown>[]).map((m) => ({
        ...(m.id ? { id: m.id } : {}),
        project_id: id,
        name: (m.name as string) || null,
        task_milestone_id: (m.task_milestone_id as string) || null,
        date_from: (m.date_from as string) || null,
        date_to: (m.date_to as string) || null,
      }))
      const { error } = await supabase.from('team_members').upsert(rows)
      if (error) {
        console.error('[PUT /api/projects/[id]/team] upsert error:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json({ team_members: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
