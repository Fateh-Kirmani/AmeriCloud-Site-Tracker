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

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[GET /api/projects/[id]/milestones]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    return NextResponse.json(data)
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

  const { milestones, deleted_ids } = body as { milestones: unknown; deleted_ids: unknown }
  if (!Array.isArray(milestones) || !Array.isArray(deleted_ids)) {
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
      const { error } = await supabase.from('milestones').delete().in('id', deleted_ids)
      if (error) {
        console.error('[PUT /api/projects/[id]/milestones] delete error:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    if (milestones.length > 0) {
      const rows = (milestones as Record<string, unknown>[]).map((m) => ({
        ...(m.id ? { id: m.id } : {}),
        project_id: id,
        details: (m.details as string) || null,
        owner: (m.owner as string) || null,
        projected_date: (m.projected_date as string) || null,
        actualized_date: (m.actualized_date as string) || null,
        notes: (m.notes as string) || null,
      }))
      const { error } = await supabase.from('milestones').upsert(rows)
      if (error) {
        console.error('[PUT /api/projects/[id]/milestones] upsert error:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
    return NextResponse.json({ milestones: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
